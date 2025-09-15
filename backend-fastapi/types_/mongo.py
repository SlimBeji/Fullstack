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

#### Public Types for searching data ####

FilterOperation = Literal[
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


#### Internal Types for building Mongo queries ####

type SortData = dict[str, Literal[-1, 1]]

type Projection = dict[str, Literal[0, 1]]


type MongoFieldFilters = dict[str, Any]

type MongoFieldsFilters = dict[str, MongoFieldFilters]


class MongoFindQuery(BaseModel):
    pagination: PaginationData | None = PaginationData(
        page=1, size=settings.MAX_ITEMS_PER_PAGE
    )
    sort: SortData = {}
    filters: MongoFieldsFilters | None = {}
    projection: Projection | None = {}
