from pydantic import BaseModel

from .filters import WhereFilters


class SearchQuery[Selectables: str, Sortables: str, Searchables: str](
    BaseModel
):
    page: int = 1
    size: int | None = None
    orderby: list[Sortables] | None = None
    select: list[Selectables] | None = None
    where: WhereFilters[Searchables] | None = None
