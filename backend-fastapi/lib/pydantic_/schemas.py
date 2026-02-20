from typing import Annotated, Generic, TypeVar, cast

from pydantic import BaseModel, Field
from pydantic.fields import FieldInfo, ModelPrivateAttr

SortableFields = TypeVar("SortableFields")
SelectableFields = TypeVar("SelectableFields")


class BaseGetSchema(BaseModel, Generic[SelectableFields]):
    _DEFAULT_FIELDS: list[str] = ["id"]

    fields: Annotated[
        list[SelectableFields] | None,
        Field(
            description="Fields to include in the response; omit for full document",
            examples=[_DEFAULT_FIELDS],
        ),
    ] = None

    def __init_subclass__(cls, **kwargs):
        super().__init_subclass__(**kwargs)

        # Update fields default and examples
        default_fields = cast(ModelPrivateAttr, cls._DEFAULT_FIELDS)
        fields_field = cls.model_fields["fields"]
        cls.model_fields["fields"] = FieldInfo(
            annotation=fields_field.annotation,
            default=default_fields.default,
            description=fields_field.description,
            examples=[default_fields.default],
        )


class BaseSearchSchema(BaseModel, Generic[SelectableFields, SortableFields]):
    _MAX_SIZE: int = 100
    _DEFAULT_SORT: list[str] = ["-createdAt"]
    _DEFAULT_FIELDS: list[str] = ["id"]

    page: Annotated[int, Field(1, description="The page number")]
    size: Annotated[int, Field(_MAX_SIZE, description="Items per page")]
    sort: Annotated[
        list[SortableFields] | None,
        Field(
            description="Fields to use for sorting. Use '-' for descending",
            examples=[_DEFAULT_SORT],
        ),
    ] = None
    fields: Annotated[
        list[SelectableFields] | None,
        Field(
            description="Fields to include in the response; omit for full document",
            examples=[_DEFAULT_FIELDS],
        ),
    ] = None

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
            default=default_sort.default,
            description=sort_field.description,
            examples=[default_sort.default],
        )

        # Update fields default and examples
        default_fields = cast(ModelPrivateAttr, cls._DEFAULT_FIELDS)
        fields_field = cls.model_fields["fields"]
        cls.model_fields["fields"] = FieldInfo(
            annotation=fields_field.annotation,
            default=default_fields.default,
            description=fields_field.description,
            examples=[default_fields.default],
        )
