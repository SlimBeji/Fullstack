from datetime import datetime
from types import UnionType
from typing import (
    Annotated,
    Any,
    Callable,
    Generic,
    Literal,
    Optional,
    TypedDict,
    TypeVar,
    cast,
    get_args,
)

from beanie.odm.fields import PydanticObjectId
from pydantic import (
    BaseModel,
    BeforeValidator,
    EmailStr,
    Field,
    TypeAdapter,
    create_model,
)
from pydantic.fields import FieldInfo
from pydantic.networks import EmailStr
from pydantic_core import PydanticCustomError

from config import settings
from lib.utils import str_to_bool
from types_ import FilterOperation

# Utility Methods


def get_pydantic_flat_fields(model: type[BaseModel], prefix: str = "") -> list[str]:
    paths = []
    for name, field in model.model_fields.items():
        annotation = field.annotation
        if isinstance(annotation, type) and issubclass(annotation, BaseModel):
            paths.extend(get_pydantic_flat_fields(annotation, f"{prefix}{name}."))
        elif isinstance(annotation, UnionType):
            arg = get_args(annotation)[0]
            paths.extend(get_pydantic_flat_fields(arg, f"{prefix}{name}."))
        else:
            paths.append(f"{prefix}{name}")
    return paths


def get_field_info(field) -> FieldInfo | None:
    extra = get_args(field)[1:]
    for metadata in extra:
        if isinstance(metadata, FieldInfo):
            return metadata
    return None


def copy_fields(model: type[BaseModel]) -> dict[str, tuple[type[Any], Any]]:
    new_fields: dict[str, tuple[type[Any], Any]] = {}
    for k, v in model.model_fields.items():
        annotation = cast(type[Any], v.annotation)
        default = v.default
        new_fields[k] = (annotation, default)
    return new_fields


# FieldFilter

T = TypeVar("T")

check_filter_op: Callable = TypeAdapter(FilterOperation).validate_python


class FieldFilter(TypedDict):
    op: FilterOperation
    val: Any


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
    op: FilterOperation, raw: str, adapter: TypeAdapter, is_indexed: bool = False
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
    op: FilterOperation, raw: str, adapter: TypeAdapter
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
    op: FilterOperation, raw: str, adapter: TypeAdapter
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


def _id_filter_validator(
    op: FilterOperation, raw: str, adapter: TypeAdapter
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
    else:
        raise PydanticCustomError(
            "invalid ObjectId operation",
            f"{op} is not a valid operation for linked fields",
        )


def make_filter_validator(real_type: Any):
    base_class = get_args(real_type)[0]
    annotations = get_field_info(real_type)
    json_schema_extra = getattr(annotations, "json_schema_extra") or {}
    is_indexed: bool = json_schema_extra.get("is_indexed", False)
    adapter = TypeAdapter(real_type)

    if base_class not in [int, float, str, EmailStr, bool, datetime, PydanticObjectId]:
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
        elif base_class in [PydanticObjectId]:
            return _id_filter_validator(op, raw_val, adapter)
        else:
            # This should not be reached. Linting purposes
            raise RuntimeError(f"Unknow base type {base_class}")

    return validator


class QueryFilter(Generic[T]):
    def __class_getitem__(cls, item):
        field_info = get_field_info(item)
        return Annotated[
            str | FieldFilter,
            BeforeValidator(make_filter_validator(item)),
            Field(examples=field_info.examples),
        ]


class QueryFilters(Generic[T]):
    def __class_getitem__(cls, item):
        field_info = get_field_info(item)
        description = getattr(field_info, "description", "")
        return Annotated[
            Optional[list[QueryFilter[item]]], Field(None, description=description)
        ]


# Search Schema


def _build_pagination_fields() -> dict[str, tuple[type[Any], Any]]:
    fields: dict[str, tuple[type[Any], Any]] = {}
    fields["page"] = (
        cast(type[Any], Annotated[int, Field(description="The page number")]),
        1,
    )
    fields["size"] = (
        cast(type[Any], Annotated[int, Field(description="Items per page")]),
        settings.MAX_ITEMS_PER_PAGE,
    )
    return fields


def _build_sort_fields(sortables: Any) -> dict[str, tuple[type[Any], Any]]:
    fields: dict[str, tuple[type[Any], Any]] = {}
    options = cast(list[str], get_args(sortables))
    all_options: list[str] = []
    for o in options:
        all_options.extend([o, f"-{o}"])
    fields["sort"] = (
        cast(
            type[Any],
            Annotated[
                list[Literal[tuple(all_options)]],  # type: ignore
                Field(
                    description="Fields to use for sorting. Use '-' for descending",
                    examples=[["-createdAt"]],
                ),
            ],
        ),
        None,
    )
    return fields


def _build_projection_fields(
    model: type[BaseModel],
) -> dict[str, tuple[type[Any], Any]]:
    fields: dict[str, tuple[type[Any], Any]] = {}
    fields["fields"] = (
        cast(
            type[Any],
            Annotated[
                list[Literal[tuple(get_pydantic_flat_fields(model))]],  # type: ignore
                Field(
                    description="Fields to include in the response; omit for full document",
                    examples=[["id"]],
                ),
            ],
        ),
        None,
    )
    return fields


def build_search_schema(
    name: str,
    filter_model: type[BaseModel],
    sortable_fields: Any,
    read_model: type[BaseModel] | None = None,
) -> type[BaseModel]:
    # Step 1: Copy Original Fields
    new_fields = copy_fields(filter_model)

    # Step 2: Add Pagination Fields
    new_fields.update(_build_pagination_fields())

    # Step 3: Add Sorting values
    new_fields.update(_build_sort_fields(sortable_fields))

    # Step 4: Add projection field if read_model is provided
    if read_model:
        new_fields.update(_build_projection_fields(read_model))

    # Step 5: Return model
    return create_model(name, **new_fields)  # type: ignore
