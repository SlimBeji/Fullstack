from typing import Any, Generic, Literal, TypeVar

from beanie import Insert, Replace, Update
from pydantic import BaseModel

from config import settings
from types_.http import PaginationData

SaveEvent = [Insert, Replace, Update]

ChangeEvent = [Replace, Update]

Sortables = TypeVar("Sortables", bound=str)
Selectables = TypeVar("Selectables", bound=str)
Searchables = TypeVar("Searchables", bound=str)

type SortData[Sortables: str] = dict[Sortables, Literal[-1, 1]]


type Projection[Selectables: str] = dict[
    Selectables | Literal["_version"], Literal[0, 1]
]

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


class Filter(BaseModel):
    op: FilterOperation
    val: Any


type FindQueryFilters[Searchables: str] = dict[Searchables, list[Filter]]


class FindQuery(BaseModel, Generic[Selectables, Sortables, Searchables]):
    page: int = 1
    size: int = settings.MAX_ITEMS_PER_PAGE
    sort: list[Sortables] | None = None
    fields: list[Selectables] | None = None
    filters: FindQueryFilters[Searchables] | None = None


type MongoFieldFilters = dict[MongoOperation, Any]

type MongoFieldsFilters[Searchables: str] = dict[Searchables, MongoFieldFilters]


class MongoFindQuery(BaseModel, Generic[Selectables, Sortables, Searchables]):
    pagination: PaginationData | None = PaginationData(
        page=1, size=settings.MAX_ITEMS_PER_PAGE
    )
    sort: SortData[Sortables] = {}
    filters: MongoFieldsFilters[Searchables] | None = {}
    projection: Projection[Selectables] | None = {}
