from typing import Annotated, Generic, TypeVar, cast

from pydantic import BaseModel, Field
from pydantic.fields import ModelPrivateAttr

SortableFields = TypeVar("SortableFields")

SelectableFields = TypeVar("SelectableFields")


class BaseFiltersSchema(BaseModel, Generic[SelectableFields, SortableFields]):
    _MAX_SIZE: int = 100

    page: Annotated[int, Field(1, description="The page number")]
    size: Annotated[int, Field(_MAX_SIZE, description="Items per page")]
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

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)
        private_field = cast(ModelPrivateAttr, cls._MAX_SIZE)
        max_size = private_field.default
        cls.model_fields["size"].default = max_size
