from typing import Any, Literal, TypedDict

from pydantic import BaseModel

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
]


# Using TypedDict instead of dataclass because of easy serialization
class Filter(TypedDict):
    op: FilterOperation
    val: Any


type WhereFilters[Searchables: str] = dict[Searchables, list[Filter]]


class SearchQuery[Selectables: str, Sortables: str, Searchables: str](
    BaseModel
):
    page: int = 1
    size: int | None = None
    orderby: list[Sortables] | None = None
    select: list[Selectables] | None = None
    where: WhereFilters[Searchables] | None = None
