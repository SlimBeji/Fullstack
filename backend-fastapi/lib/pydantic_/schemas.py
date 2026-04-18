from typing import Annotated, cast

from fastapi import Query
from pydantic import BaseModel, Field

from lib.types_ import SearchQuery, WhereFilters

type FieldsQuery[T: str] = Annotated[
    list[T] | None,
    Query(
        description="Fields to include in the response; omit for complete data",
        examples=[["id"]],
    ),
]


class BaseSearchSchema[
    SelectableFields: str,
    SortableFields: str,
    SearchableFields: str,
](BaseModel):
    page: Annotated[int, Field(description="The page number")] = 1
    size: Annotated[int, Field(description="Items per page")] = 100
    sort: Annotated[
        list[SortableFields] | None,
        Field(
            description="Fields to use for sorting. Use '-' for descending",
            json_schema_extra={"examples": [["-created_at"]]},
        ),
    ] = None
    fields: Annotated[
        list[SelectableFields] | None,
        Field(
            description="Fields to include in the response; omit for complete data",
            json_schema_extra={"examples": ["id"]},
        ),
    ] = None

    def to_search(
        self,
    ) -> SearchQuery[SelectableFields, SortableFields, SearchableFields]:
        where = {}
        for field_name in self.__class__.model_fields:
            if field_name not in ["page", "size", "sort", "fields"]:
                val = getattr(self, field_name)
                if val is not None:
                    where[field_name] = val

        return SearchQuery[SelectableFields, SortableFields, SearchableFields](
            page=self.page,
            size=self.size,
            select=self.fields,
            orderby=self.sort,
            where=cast(WhereFilters[SearchableFields], where),
        )
