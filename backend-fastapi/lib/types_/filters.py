from typing import Any, Generic, Literal, TypedDict, TypeVar

from pydantic import BaseModel

Selectables = TypeVar("Selectables", bound=str)
Sortables = TypeVar("Sortables", bound=str)
Searchables = TypeVar("Searchables", bound=str)

# ---- Public Types for searching data ----

FilterOperation = Literal[
    "eq",
    "ne",
    "null",
    "in",
    "nin",
    "lt",
    "lte",
    "gt",
    "gte",
    "like",
    "ilike",
    "regex",
]


# Using TypedDict instead of dataclass because of easy serialization
class Filter(TypedDict):
    op: FilterOperation
    val: Any


type WhereFilters[Searchables: str] = dict[Searchables, list[Filter]]


class SearchQuery(BaseModel, Generic[Selectables, Sortables, Searchables]):
    page: int = 1
    size: int
    orderby: list[Sortables] | None = None
    select: list[Selectables] | None = None
    where: WhereFilters[Searchables] | None = None
