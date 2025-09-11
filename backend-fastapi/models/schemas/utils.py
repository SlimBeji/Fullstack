from typing import Annotated, Generic, TypeVar

from pydantic import BaseModel, Field

from config import settings

SortableFields = TypeVar("SortableFields")

SelectableFields = TypeVar("SelectableFields")


class BaseFiltersSchema(BaseModel, Generic[SelectableFields, SortableFields]):
    page: Annotated[int, Field(1, description="The page number")]
    size: Annotated[
        int, Field(settings.MAX_ITEMS_PER_PAGE, description="Items per page")
    ]
    sort: Annotated[
        list[SortableFields] | None,
        Field(
            description="Fields to use for sorting. Use '-' for descending",
            examples=[["-createdAt"]],
        ),
    ] = None
    fields: Annotated[
        list[SelectableFields] | None,
        Field(
            description="Fields to include in the response; omit for full document",
            examples=[["-id"]],
        ),
    ] = None
