from pydantic import BaseModel

from .filters import WhereFilters


class SearchQuery[Selectable: str, Sortable: str, Searchable: str](BaseModel):
    page: int = 1
    size: int | None = None
    orderby: list[Sortable] | None = None
    select: list[Selectable] | None = None
    where: WhereFilters[Searchable] | None = None
