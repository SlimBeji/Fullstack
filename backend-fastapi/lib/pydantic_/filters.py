from datetime import datetime
from typing import (
    Annotated,
    Any,
    Callable,
    Generic,
    Optional,
    TypeVar,
    cast,
    get_args,
)

from pydantic import (
    AfterValidator,
    BeforeValidator,
    EmailStr,
    Field,
    TypeAdapter,
)
from pydantic.fields import FieldInfo
from pydantic_core import PydanticCustomError

from lib.types_ import Filter, FilterOperation
from lib.utils import check_bool

T = TypeVar("T")

check_filter_op: Callable = TypeAdapter(FilterOperation).validate_python


def _numeric_filter_validator(
    op: FilterOperation, raw: str, adapter: TypeAdapter, is_index: bool = False
) -> Filter:
    if is_index:
        return _index_filter_validator(op, raw, adapter)

    if op in ["eq", "ne", "gt", "gte", "lt", "lte"]:
        val = adapter.validate_python(raw)
        return Filter(op=op, val=val)
    elif op in ["in", "nin"]:
        l = raw.split(",")
        val = [adapter.validate_python(item) for item in l]
        return Filter(op=op, val=val)
    elif op == "null":
        val = check_bool(raw)
        return Filter(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid numeric operation",
            f"{op} is not a valid operation for numeric fields - Valid: eq,ne,gt,gte,lt,lte,in,nin,null",
        )


def _index_filter_validator(
    op: FilterOperation, raw: str, adapter: TypeAdapter
) -> Filter:
    if op in ["eq", "ne"]:
        val = adapter.validate_python(raw)
        return Filter(op=op, val=val)
    elif op in ["in", "nin"]:
        l = raw.split(",")
        val = [adapter.validate_python(item) for item in l]
        return Filter(op=op, val=val)
    elif op == "null":
        val = check_bool(raw)
        return Filter(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid ObjectId operation",
            f"{op} is not a valid operation for linked fields - Valid: eq,ne,null,in,nin",
        )


def _string_filter_validator(
    op: FilterOperation,
    raw: str,
    adapter: TypeAdapter,
) -> Filter:
    if op in ["eq", "ne"]:
        val = adapter.validate_python(raw)
        return Filter(op=op, val=val)
    elif op in ["in", "nin"]:
        l = raw.split(",")
        val = [adapter.validate_python(item) for item in l]
        return Filter(op=op, val=val)
    elif op == "null":
        val = check_bool(raw)
        return Filter(op=op, val=val)
    elif op in ["like", "ilike"]:
        return Filter(op=op, val=raw)
    else:
        raise PydanticCustomError(
            "invalid string operation",
            f"{op} is not a valid operation for string fields - Valid: eq,ne,in,nin,null,like,ilike",
        )


def _boolean_filter_validator(
    op: FilterOperation, raw: str, adapter: TypeAdapter
) -> Filter:
    if op in ["eq", "ne", "null"]:
        val = check_bool(raw)
        return Filter(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid boolean operation",
            f"{op} is not a valid operation for boolean fields - Valid: eq,ne,null",
        )


def _datetime_filter_validator(
    op: FilterOperation, raw: str, adapter: TypeAdapter
) -> Filter:
    if op in ["eq", "ne", "gt", "gte", "lt", "lte"]:
        val = adapter.validate_python(raw)
        return Filter(op=op, val=val)
    elif op in ["in", "nin"]:
        l = raw.split(",")
        val = [adapter.validate_python(item) for item in l]
        return Filter(op=op, val=val)
    elif op == "null":
        val = check_bool(raw)
        return Filter(op=op, val=val)
    else:
        raise PydanticCustomError(
            "invalid datetime operation",
            f"{op} is not a valid operation for datetime fields - Valid: eq,ne,gt,gte,lt,lte,in,nin,null",
        )


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


def _make_filter_validator(real_type: Any):
    base_class = get_args(real_type)[0]
    annotations = _get_field_info(real_type)
    json_schema_extra = getattr(annotations, "json_schema_extra") or {}
    is_index: bool = json_schema_extra.get("is_index", False)
    adapter = TypeAdapter(real_type)

    if base_class not in [int, float, str, EmailStr, bool, datetime]:
        raise RuntimeError(f"Unknow base type {base_class}")

    def validator(value: str | dict) -> Filter:
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
            return _numeric_filter_validator(op, raw_val, adapter, is_index)
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


class HttpFilter(Generic[T]):
    def __class_getitem__(cls, item):
        field_info = _get_field_info(item)
        extra = getattr(field_info, "json_schema_extra", None) or {}
        examples = extra.get("filter_examples", None)
        if not examples and field_info is not None:
            examples = field_info.examples

        return Annotated[
            str | Filter,
            BeforeValidator(_make_filter_validator(item)),
            Field(examples=examples),
        ]


def _field_filters_validator(filters: list[Filter]):
    used_operators: list[FilterOperation] = []
    errors: list[str] = []
    duplicate: list[str] = []

    # Rule 0: make sure no operator is used twice
    for filter in filters:
        op = filter["op"]
        if op in used_operators and op not in duplicate:
            duplicate.append(op)
            errors.append(
                f"cannot use an operator twice for the same field. {op} used multiple times"
            )
        used_operators.append(op)

    length = len(used_operators)
    eq_used = "eq" in used_operators

    # Rule 1: eq should be used exclusively
    if length >= 2 and eq_used:
        errors.append(
            f"eq can only be used exclusively. {used_operators} used at the same time"
        )

    # Rule 2: if eq not used than null should be used exclusively
    elif not eq_used and "null" in used_operators and length >= 2:
        errors.append(
            f"null operator should be used exclusively. {used_operators} used at the same time"
        )

    # Rule 3: if eq not used than in should be used exclusively
    elif not eq_used and "in" in used_operators and length >= 2:
        errors.append(
            f"in operator should be used exclusively. {used_operators} used at the same time"
        )

    # Rule 4: gt/gte cannot be used together
    if "gt" in used_operators and "gte" in used_operators:
        errors.append("gt and gte operators should not be used together")

    # Rule 5: lt/lte cannot be used together
    if "lt" in used_operators and "lte" in used_operators:
        errors.append("lt and lte operators should not be used together")

    # Rule 6: like/ilike cannot be used together
    if "like" in used_operators and "ilike" in used_operators:
        errors.append("like and ilike operators should not be used together")

    return filters


class HttpFilters(Generic[T]):
    def __class_getitem__(cls, item):
        field_info = _get_field_info(item)
        description = getattr(field_info, "description", "")
        extra = getattr(field_info, "json_schema_extra", None) or {}
        examples = extra.get("filter_examples", None)
        if examples is None:
            field_info = _get_field_info(item)
            if field_info is not None:
                examples = field_info.examples
            else:
                examples = []

        return Annotated[
            Optional[list[HttpFilter[item]]],
            Field(
                None,
                description=description,
                json_schema_extra=extra,
                examples=examples,
            ),
            AfterValidator(_field_filters_validator),
        ]
