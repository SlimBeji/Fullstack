from typing import Any, Literal, TypedDict

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
