from typing import Callable

from sqlalchemy import Select
from sqlalchemy.orm import InstrumentedAttribute

from ..types_ import Filter, WhereFilters
from .types import OrderBy, SelectField, TableSelection


def apply_order_by(
    query: Select,
    clauses: list[str],
    map_func: Callable[[str], InstrumentedAttribute],
) -> Select:
    if len(clauses) == 0:
        return query

    # Convert strings to OrderBy objects
    order_by_list = [OrderBy.from_string(clause) for clause in clauses]

    # Map each field to InstrumentedAttribute and apply order
    for order_by in order_by_list:
        column = map_func(order_by.field)
        if order_by.order == "DESC":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())

    return query


def apply_select(
    query: Select,
    clauses: list[str],
    map_func: Callable[[str], list[SelectField]],
) -> Select:
    if len(clauses) == 0:
        return query

    tables: dict[str, TableSelection] = {}

    for clause in clauses:
        select_fields = map_func(clause)
        for select_field in select_fields:
            if select_field.joins:
                # Relationship field
                table_name = select_field.tablename
                path = [j.relation for j in select_field.joins]
            else:
                # Main entity field
                table_name = ""
                path = []

            if table_name not in tables:
                tables[table_name] = TableSelection(
                    table_name=table_name, fields=set(), path=path
                )
            tables[table_name].fields.add(select_field.select)

    # Apply all load options
    for table_selection in tables.values():
        query = query.options(table_selection.to_selection_load())

    return query


def _apply_single_where(
    query: Select,
    column: InstrumentedAttribute,  # the actual column to filter
    filter: Filter,  # the filter to apply
) -> Select:
    op = filter["op"]
    val = filter["val"]

    if op == "eq":
        query = query.where(column == val)
    elif op == "ne":
        query = query.where(column != val)
    elif op == "null":
        if val is True:
            query = query.where(column.is_(None))
        else:
            query = query.where(column.is_not(None))
    elif op == "in":
        query = query.where(column.in_(val))
    elif op == "nin":
        query = query.where(column.not_in(val))
    elif op == "lt":
        query = query.where(column < val)
    elif op == "lte":
        query = query.where(column <= val)
    elif op == "gt":
        query = query.where(column > val)
    elif op == "gte":
        query = query.where(column >= val)
    elif op == "like":
        query = query.where(column.like(f"%{val}%"))
    elif op == "ilike":
        query = query.where(column.ilike(f"%{val}%"))
    elif op == "regex":
        query = query.where(column.op("~*")(val))
    else:
        raise ValueError(f"Unknown field filter operator {op}")

    return query


def apply_where(
    query: Select,
    clauses: WhereFilters,
    map_func: Callable[[str], InstrumentedAttribute],
) -> Select:
    for field, field_filters in clauses.items():
        if not field_filters:
            continue
        column = map_func(field)
        for filter in field_filters:
            query = _apply_single_where(query, column, filter)

    return query
