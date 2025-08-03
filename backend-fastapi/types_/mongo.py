from typing import Any, Literal

from beanie import Insert, Replace, Update
from pydantic import BaseModel

from types_.http import PaginationData

SaveEvent = [Insert, Replace, Update]

ChangeEvent = [Replace, Update]

type MongoOp = Literal[
    "$eq",
    "$ne",
    "$gt",
    "$gte",
    "$lt",
    "$lte",
    "$in",
    "$nin",
    "$regex",
    "$text",
    "$exists",
]

type FilterOp = Literal[
    "eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "regex", "text", "exists"
]
type ProjectionIncl = dict[str, Literal[1] | ProjectionIncl]

type ProjectionExcl = dict[str, Literal[0] | ProjectionExcl]

type SortData = dict[str, Literal[-1, 1]]

type MongoFieldFilters = dict[MongoOp, Any]

type MongoFieldsFilters = dict[str, MongoFieldFilters]


class MongoBaseFilter(BaseModel):
    op: FilterOp
    val: list[str]


class MongoFindQuery(BaseModel):
    pagination: PaginationData | None
    sort: SortData | None
    filters: MongoFieldsFilters | None
    projection: ProjectionIncl | None
