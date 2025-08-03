import json
from datetime import datetime
from typing import Annotated, Any, Callable, Generic, TypedDict, TypeVar, cast, get_args

from beanie import Link
from beanie.odm.fields import PydanticObjectId
from bson import ObjectId
from pydantic import BeforeValidator, EmailStr, TypeAdapter
from pydantic.networks import EmailStr
from pydantic_core import PydanticCustomError

from lib.utils import str_to_bool
from types_ import FilterOp

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
        if raw.startswith("["):
            try:
                l: list[str] = json.loads(raw)
            except json.JSONDecodeError:
                raise PydanticCustomError(
                    "invalid json list",
                    f"{raw} is not a valid json list of numeric values",
                )

            val = [adapter.validate_python(item) for item in l]
            return dict(op=op, val=val)
        else:
            val = adapter.validate_python(raw)
            return dict(op=op, val=[val])
    elif op == "exists":
        val = str_to_bool(raw)
        return dict(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid numeric operation",
            f"{op} is not a valid operation for numeric fields",
        )


def _string_filter_validator(
    op: FilterOp, raw: str, adapter: TypeAdapter
) -> FieldFilter:
    if op in ["eq", "ne"]:
        val = adapter.validate_python(raw)
        return dict(op=op, val=val)
    elif op in ["in", "nin"]:
        if raw.startswith("["):
            try:
                l: list[str] = json.loads(raw)
            except json.JSONDecodeError:
                raise PydanticCustomError(
                    "invalid json list",
                    f"{raw} is not a valid json list of string values",
                )

            val = [adapter.validate_python(item) for item in l]
            return dict(op=op, val=val)
        else:
            val = adapter.validate_python(raw)
            return dict(op=op, val=[val])
    elif op == "exists":
        val = str_to_bool(raw)
        return dict(op=op, val=val)
    elif op == "regex":
        return dict(op=op, val=raw)
    elif op == "text":
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
        if raw.startswith("["):
            try:
                l: list[str] = json.loads(raw)
            except json.JSONDecodeError:
                raise PydanticCustomError(
                    "invalid json list",
                    f"{raw} is not a valid json list of datetime values",
                )

            val = [adapter.validate_python(item) for item in l]
            return dict(op=op, val=val)
        else:
            val = adapter.validate_python(raw)
            return dict(op=op, val=[val])
    elif op == "exists":
        val = str_to_bool(raw)
        return dict(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid datetime operation",
            f"{op} is not a valid operation for datetime fields",
        )


def make_filter_validator(real_type: Any):
    base_class = get_args(real_type)[0]
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
            return _string_filter_validator(op, raw_val, adapter)
        elif base_class in [bool]:
            return _boolean_filter_validator(op, raw_val, adapter)
        elif base_class in [datetime]:
            return _datetime_filter_validator(op, raw_val, adapter)
        else:
            # This should not be reached. Linting purposes
            raise RuntimeError(f"Unknow base type {base_class}")

    return validator


class FilterParam(Generic[T]):
    def __class_getitem__(cls, item):
        return Annotated[
            FieldFilter,
            BeforeValidator(make_filter_validator(item)),
        ]
