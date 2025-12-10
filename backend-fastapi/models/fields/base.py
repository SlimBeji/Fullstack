from datetime import datetime
from typing import (
    Annotated,
    Any,
    Callable,
    Generic,
    Optional,
    TypedDict,
    TypeVar,
    cast,
    get_args,
)

from beanie.odm.fields import PydanticObjectId
from fastapi import File, Form
from pydantic import BeforeValidator, EmailStr, Field, TypeAdapter
from pydantic.fields import FieldInfo
from pydantic_core import PydanticCustomError

from lib.types_ import FilterOperation
from lib.utils import str_to_bool

# FieldMeta


class FieldMeta:
    def __init__(
        self,
        default: Any = ...,
        min_length: int | None = None,
        max_length: int | None = None,
        description: str | None = None,
        examples: list | None = None,
        filter_examples: list | None = None,
        is_file: bool = False,
    ):
        # Metatdata
        self.default = default
        self.min_length = min_length
        self.max_length = max_length
        self.description = description
        self.examples = examples
        self.filter_examples = filter_examples
        self.is_file = is_file

        # HTTP Fields
        self.info = self._build_field()
        self.multipart = self._build_multpart_field()

    def _build_metadata(self) -> dict:
        metadata = dict(
            default=self.default,
            min_length=self.min_length,
            max_length=self.max_length,
            description=self.description,
            examples=self.examples,
        )

        if self.filter_examples:
            metadata["json_schema_extra"] = dict(
                filter_examples=self.filter_examples
            )

        return metadata

    def _build_field(self) -> FieldInfo:
        if self.is_file:
            return File(description=self.description)

        metatdata = self._build_metadata()
        return Field(**metatdata)

    def _build_multpart_field(self) -> Any:
        if self.is_file:
            return File(description=self.description)

        metatdata = self._build_metadata()
        return Form(**metatdata)


# HttpFilter


T = TypeVar("T")

check_filter_op: Callable = TypeAdapter(FilterOperation).validate_python


class FieldFilter(TypedDict):
    op: FilterOperation
    val: Any


def _get_field_info(field) -> FieldInfo | None:
    extra = get_args(field)[1:]
    for metadata in extra:
        if isinstance(metadata, FieldInfo):
            return metadata
    return None


def _extract_raw_filter(value: str) -> tuple[FilterOperation, Any]:
    if ":" in value:
        op, raw_val = value.split(":", 1)
    else:
        op, raw_val = "eq", value

    check_filter_op(op)
    return cast(FilterOperation, op), raw_val


def _numeric_filter_validator(
    op: FilterOperation, raw: str, adapter: TypeAdapter
) -> FieldFilter:
    if op in ["eq", "ne", "gt", "gte", "lt", "lte"]:
        val = adapter.validate_python(raw)
        return FieldFilter(op=op, val=val)
    elif op in ["in", "nin"]:
        l = raw.split(",")
        val = [adapter.validate_python(item) for item in l]
        return FieldFilter(op=op, val=val)
    elif op == "exists":
        val = str_to_bool(raw)
        return FieldFilter(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid numeric operation",
            f"{op} is not a valid operation for numeric fields",
        )


def _string_filter_validator(
    op: FilterOperation,
    raw: str,
    adapter: TypeAdapter,
    is_indexed: bool = False,
) -> FieldFilter:
    if op in ["eq", "ne"]:
        val = adapter.validate_python(raw)
        return FieldFilter(op=op, val=val)
    elif op in ["in", "nin"]:
        l = raw.split(",")
        val = [adapter.validate_python(item) for item in l]
        return FieldFilter(op=op, val=val)
    elif op == "exists":
        val = str_to_bool(raw)
        return FieldFilter(op=op, val=val)
    elif op == "regex":
        return FieldFilter(op=op, val=raw)
    elif op == "text":
        if is_indexed is False:
            raise PydanticCustomError(
                "invalid $text operation",
                "$text operation can only be performed of indexed string fields",
            )
        return FieldFilter(op=op, val=raw)
    else:
        raise PydanticCustomError(
            "invalid string operation",
            f"{op} is not a valid operation for string fields",
        )


def _boolean_filter_validator(
    op: FilterOperation, raw: str, adapter: TypeAdapter
) -> FieldFilter:
    if op in ["eq", "ne", "exists"]:
        val = str_to_bool(raw)
        return FieldFilter(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid boolean operation",
            f"{op} is not a valid operation for boolean fields",
        )


def _datetime_filter_validator(
    op: FilterOperation, raw: str, adapter: TypeAdapter
) -> FieldFilter:
    if op in ["eq", "ne", "gt", "gte", "lt", "lte"]:
        val = adapter.validate_python(raw)
        return FieldFilter(op=op, val=val)
    elif op in ["in", "nin"]:
        l = raw.split(",")
        val = [adapter.validate_python(item) for item in l]
        return FieldFilter(op=op, val=val)
    elif op == "exists":
        val = str_to_bool(raw)
        return FieldFilter(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid datetime operation",
            f"{op} is not a valid operation for datetime fields",
        )


def _id_filter_validator(
    op: FilterOperation, raw: str, adapter: TypeAdapter
) -> FieldFilter:
    if op in ["eq", "ne"]:
        val = adapter.validate_python(raw)
        return FieldFilter(op=op, val=val)
    elif op in ["in", "nin"]:
        l = raw.split(",")
        val = [adapter.validate_python(item) for item in l]
        return FieldFilter(op=op, val=val)
    elif op == "exists":
        val = str_to_bool(raw)
        return FieldFilter(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid ObjectId operation",
            f"{op} is not a valid operation for linked fields",
        )


def make_filter_validator(real_type: Any):
    base_class = get_args(real_type)[0]
    annotations = _get_field_info(real_type)
    json_schema_extra = getattr(annotations, "json_schema_extra") or {}
    is_indexed: bool = json_schema_extra.get("is_indexed", False)
    adapter = TypeAdapter(real_type)

    if base_class not in [
        int,
        float,
        str,
        EmailStr,
        bool,
        datetime,
        PydanticObjectId,
    ]:
        raise RuntimeError(f"Unknow base type {base_class}")

    def validator(value: str | dict) -> FieldFilter:
        if isinstance(value, str):
            op, raw_val = _extract_raw_filter(value)
        else:
            try:
                op = value["op"]
                raw_val = value["val"]
            except KeyError:
                message: str = (
                    f"Field Filter {value} is not valid. It must define the op and val fields"
                )
                raise PydanticCustomError("Invalid Field Filter", message)  # type: ignore

        if base_class in [int, float]:
            return _numeric_filter_validator(op, raw_val, adapter)
        elif base_class in [str, EmailStr]:
            return _string_filter_validator(op, raw_val, adapter, is_indexed)
        elif base_class in [bool]:
            return _boolean_filter_validator(op, raw_val, adapter)
        elif base_class in [datetime]:
            return _datetime_filter_validator(op, raw_val, adapter)
        elif base_class in [PydanticObjectId]:
            return _id_filter_validator(op, raw_val, adapter)
        else:
            # This should not be reached. Linting purposes
            raise RuntimeError(f"Unknow base type {base_class}")

    return validator


class HttpFilter(Generic[T]):
    def __class_getitem__(cls, item):
        field_info = _get_field_info(item)
        extra = getattr(field_info, "json_schema_extra", None) or {}
        examples = extra.get("filter_examples", None)
        if not examples and field_info is not None:
            examples = field_info.examples

        return Annotated[
            str | FieldFilter,
            BeforeValidator(make_filter_validator(item)),
            Field(examples=examples),
        ]


class HttpFilters(Generic[T]):
    def __class_getitem__(cls, item):
        field_info = _get_field_info(item)
        description = getattr(field_info, "description", "")
        extra = getattr(field_info, "json_schema_extra", None) or {}
        return Annotated[
            Optional[list[HttpFilter[item]]],
            Field(
                None,
                description=description,
                json_schema_extra=extra,
            ),
        ]
