from typing import Annotated, Generic, TypeVar, cast

from fastapi import Query
from pydantic import BaseModel, Field
from pydantic.fields import FieldInfo, ModelPrivateAttr

from lib.types_ import SearchQuery, WhereFilters

ResponseFields = TypeVar("ResponseFields", bound=str)
SortableFields = TypeVar("SortableFields", bound=str)
SelectableFields = TypeVar("SelectableFields", bound=str)
SearchableFields = TypeVar("SearchableFields", bound=str)


FieldsQuery = Annotated[
    list[ResponseFields] | None,
    Query(
        description="Fields to include in the response; omit for complete data",
        examples=[["id"]],
    ),
]


class BaseSearchSchema(
    BaseModel, Generic[SelectableFields, SortableFields, SearchableFields]
):
    _MAX_SIZE: int = 100
    _DEFAULT_SORT: list[SortableFields] = ["-created_at"]  # type: ignore
    _DEFAULT_FIELDS: list[SelectableFields] = ["id"]  # type: ignore

    page: Annotated[int, Field(1, description="The page number")]
    size: Annotated[int, Field(_MAX_SIZE, description="Items per page")]
    sort: Annotated[
        list[SortableFields] | None,
        Field(
            description="Fields to use for sorting. Use '-' for descending",
            json_schema_extra={"examples": [_DEFAULT_SORT]},  # type: ignore
        ),
    ] = None
    fields: Annotated[
        list[SelectableFields] | None,
        Field(
            description="Fields to include in the response; omit for complete data",
            json_schema_extra={"examples": [_DEFAULT_FIELDS]},  # type: ignore
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

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)

        # Update size default
        private_max_size = cast(ModelPrivateAttr, cls._MAX_SIZE)
        max_size = private_max_size.default
        cls.model_fields["size"].default = max_size

        # Update sort default and examples
        default_sort = cast(ModelPrivateAttr, cls._DEFAULT_SORT)
        sort_field = cls.model_fields["sort"]
        cls.model_fields["sort"] = FieldInfo(
            annotation=sort_field.annotation,
            default=[],
            description=sort_field.description,
            json_schema_extra=dict(examples=[default_sort.default]),  # type: ignore
        )

        # Update fields default and examples
        default_fields = cast(ModelPrivateAttr, cls._DEFAULT_FIELDS)
        fields_field = cls.model_fields["fields"]
        cls.model_fields["fields"] = FieldInfo(
            annotation=fields_field.annotation,
            default=[],
            description=fields_field.description,
            json_schema_extra=dict(examples=[default_fields.default]),  # type: ignore
        )
