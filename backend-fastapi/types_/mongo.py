from typing import Any, Literal

from beanie import Insert, Replace, Update
from pydantic import BaseModel

from config import settings
from types_.http import PaginationData

SaveEvent = [Insert, Replace, Update]

ChangeEvent = [Replace, Update]

type Projection = dict[str, Literal[0, 1] | Projection]

type MongoOperation = Literal[
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

type FilterOperation = Literal[
    "eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "regex", "text", "exists"
]


class QueryFilter(BaseModel):
    op: FilterOperation
    val: list[str]


class Filter(BaseModel):
    op: FilterOperation
    val: Any


type FindQueryFilters = dict[str, list[Filter]]


class FindQuery(BaseModel):
    page: int = 1
    size: int = settings.MAX_ITEMS_PER_PAGE
    sort: list[str] | None = None
    fields: list[str] | None = None
    filters: FindQueryFilters | None = None


type MongoFieldFilters = dict[MongoOperation, Any]

type MongoFieldsFilters = dict[str, MongoFieldFilters]


class MongoFindQuery(BaseModel):
    pagination: PaginationData | None = PaginationData(
        page=1, size=settings.MAX_ITEMS_PER_PAGE
    )
    sort: list[str] | None = []
    filters: MongoFieldsFilters | None = {}
    projection: Projection | None = {}
