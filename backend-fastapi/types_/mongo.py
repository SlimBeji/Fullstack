from typing import Any, Literal

from beanie import Insert, Replace, Update
from pydantic import BaseModel

from types_.http import PaginationData

SaveEvent = [Insert, Replace, Update]

ChangeEvent = [Replace, Update]

type MongoOp = Literal[
    "$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin", "$regex", "$text"
]

type FilterOp = Literal[
    "eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "regex", "text"
]


type ProjectionIncl = dict[str, Literal[1] | ProjectionIncl]

type ProjectionExcl = dict[str, Literal[0] | ProjectionExcl]

type SortData = dict[str, Literal[-1, 1]]

type MongoFilter = dict[MongoOp, Any]

type FilterData = dict[str, MongoFilter]


class MongoBaseFilter(BaseModel):
    op: FilterOp
    val: list[str]


class FilterQuery(BaseModel):
    pagination: PaginationData | None
    sort: SortData | None
    filters: FilterData | None
    projection: ProjectionIncl | None
