from typing import Any, Generic, Literal, TypeVar

from beanie import Insert, Replace, Update
from pydantic import BaseModel

SaveEvent = [Insert, Replace, Update]

ChangeEvent = [Replace, Update]

Sortables = TypeVar("Sortables", bound=str)
Selectables = TypeVar("Selectables", bound=str)
Searchables = TypeVar("Searchables", bound=str)

# ---- Public Types for searching data ----

FilterOperation = Literal[
    "eq", "ne", "gt", "gte", "lt", "lte", "in", "nin", "regex", "text", "exists"
]


class Filter(BaseModel):
    op: FilterOperation
    val: Any


type FindQueryFilters[Searchables: str] = dict[Searchables, list[Filter]]


class FindQuery(BaseModel, Generic[Selectables, Sortables, Searchables]):
    page: int = 1
    size: int
    sort: list[Sortables] | None = None
    fields: list[Selectables] | None = None
    filters: FindQueryFilters[Searchables] | None = None
