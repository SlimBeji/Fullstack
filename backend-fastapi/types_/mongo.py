from typing import Any, Literal

from beanie import Insert, Replace, Update
from pydantic import BaseModel

from types_.http import PaginationData

SaveEvent = [Insert, Replace, Update]

ChangeEvent = [Replace, Update]

MongoOp = Literal[
    "$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin", "$regex", "$text"
]

FilterOp = Literal["eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "regex", "text"]


ProjectionIncl = dict[str, Literal[0] | "ProjectionIncl"]

ProjectionExcl = dict[str, Literal[0] | "ProjectionExcl"]

SortData = dict[str, Literal[-1, 1]]

MongoFilter = dict[MongoOp, Any]

FilterData = dict[str, MongoFilter]


class MongoBaseFilter(BaseModel):
    op: FilterOp
    val: list[str]


class FilterQuery(BaseModel):
    pagination: PaginationData | None
    sort: SortData | None
    filters: FilterData | None
    projection: ProjectionIncl | None
