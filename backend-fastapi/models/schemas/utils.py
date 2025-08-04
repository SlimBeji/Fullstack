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

from beanie import Link
from beanie.odm.fields import PydanticObjectId
from bson import ObjectId
from pydantic import BaseModel, BeforeValidator, EmailStr, Field, TypeAdapter
from pydantic.networks import EmailStr
from pydantic_core import PydanticCustomError

from lib.utils import str_to_bool
from types_ import FilterOp

# Utility Methods


def get_pydantic_flat_fields(obj: BaseModel, prefix: str = "") -> list[str]:
    paths = []
    for name, value in obj.__dict__.items():
        if isinstance(value, BaseModel):
            paths.extend(get_pydantic_flat_fields(value, f"{prefix}{name}."))
        else:
            paths.append(f"{prefix}{name}")
    return paths


# LinkedObjectId


def link_object_id_validator(value: Any) -> PydanticObjectId:
    if isinstance(value, Link):
        return PydanticObjectId(value.ref.id)
    elif isinstance(value, ObjectId):
        return PydanticObjectId(value)
    elif isinstance(value, str) and ObjectId.is_valid(value):
        return PydanticObjectId(value)
    raise ValueError(f"Invalid value for LinkedObjectId: {value}")


LinkedObjectId = Annotated[
    PydanticObjectId,
    BeforeValidator(link_object_id_validator),
]

# FieldFilter

T = TypeVar("T")

check_filter_op: Callable = TypeAdapter(FilterOp).validate_python


class FieldFilter(TypedDict):
    op: FilterOp
    val: Any


def _extract_raw_filter(value: str) -> tuple[FilterOp, Any]:
    if ":" in value:
        op, raw_val = value.split(":", 1)
    else:
        op, raw_val = "eq", value

    check_filter_op(op)
    return cast(FilterOp, op), raw_val


def _numeric_filter_validator(
    op: FilterOp, raw: str, adapter: TypeAdapter
) -> FieldFilter:
    if op in ["eq", "ne", "gt", "gte", "lt", "lte"]:
        val = adapter.validate_python(raw)
        return dict(op=op, val=val)
    elif op in ["in", "nin"]:
        l = raw.split(",")
        val = [adapter.validate_python(item) for item in l]
        return dict(op=op, val=val)
    elif op == "exists":
        val = str_to_bool(raw)
        return dict(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid numeric operation",
            f"{op} is not a valid operation for numeric fields",
        )


def _string_filter_validator(
    op: FilterOp, raw: str, adapter: TypeAdapter, is_indexed: bool = False
) -> FieldFilter:
    if op in ["eq", "ne"]:
        val = adapter.validate_python(raw)
        return dict(op=op, val=val)
    elif op in ["in", "nin"]:
        l = raw.split(",")
        val = [adapter.validate_python(item) for item in l]
        return dict(op=op, val=val)
    elif op == "exists":
        val = str_to_bool(raw)
        return dict(op=op, val=val)
    elif op == "regex":
        return dict(op=op, val=raw)
    elif op == "text":
        if is_indexed == False:
            raise PydanticCustomError(
                "invalid $text operation",
                f"$text operation can only be performed of indexed string fields",
            )
        return dict(op=op, val=raw)
    else:
        raise PydanticCustomError(
            "invalid string operation",
            f"{op} is not a valid operation for string fields",
        )


def _boolean_filter_validator(
    op: FilterOp, raw: str, adapter: TypeAdapter
) -> FieldFilter:
    if op in ["eq", "ne", "exists"]:
        val = str_to_bool(raw)
        return dict(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid boolean operation",
            f"{op} is not a valid operation for boolean fields",
        )


def _datetime_filter_validator(
    op: FilterOp, raw: str, adapter: TypeAdapter
) -> FieldFilter:
    if op in ["eq", "ne", "gt", "gte", "lt", "lte"]:
        val = adapter.validate_python(raw)
        return dict(op=op, val=val)
    elif op in ["in", "nin"]:
        l = raw.split(",")
        val = [adapter.validate_python(item) for item in l]
        return dict(op=op, val=val)
    elif op == "exists":
        val = str_to_bool(raw)
        return dict(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid datetime operation",
            f"{op} is not a valid operation for datetime fields",
        )


def make_filter_validator(real_type: Any):
    base_class, annotations = get_args(real_type)
    is_indexed: bool = annotations.json_schema_extra.get("is_indexed", False)
    adapter = TypeAdapter(real_type)

    if base_class not in [int, float, str, EmailStr, bool, datetime]:
        raise RuntimeError(f"Unknow base type {base_class}")

    def validator(value: str | dict) -> FieldFilter:
        if isinstance(value, str):
            op, raw_val = _extract_raw_filter(value)
        else:
            try:
                op = value["op"]
                raw_val = value["val"]
            except KeyError:
                raise PydanticCustomError(
                    "Invalid Field Filter",
                    f"Field Filter {value} is not valid. It must define the op and val fields",
                )

        if base_class in [int, float]:
            return _numeric_filter_validator(op, raw_val, adapter)
        elif base_class in [str, EmailStr]:
            return _string_filter_validator(op, raw_val, adapter, is_indexed)
        elif base_class in [bool]:
            return _boolean_filter_validator(op, raw_val, adapter)
        elif base_class in [datetime]:
            return _datetime_filter_validator(op, raw_val, adapter)
        else:
            # This should not be reached. Linting purposes
            raise RuntimeError(f"Unknow base type {base_class}")

    return validator


class QueryFilter(Generic[T]):
    def __class_getitem__(cls, item):
        _, field_info = get_args(item)
        example = field_info.json_schema_extra.get("example")
        return Annotated[
            str | FieldFilter,
            BeforeValidator(make_filter_validator(item)),
            Field(example=example),
        ]


class QueryFilters(Generic[T]):
    def __class_getitem__(cls, item):
        _, field_info = get_args(item)
        description = field_info.description
        return Annotated[
            Optional[list[QueryFilter[item]]], Field(None, description=description)
        ]
