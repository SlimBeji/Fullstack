from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

from lib.pydantic_ import FieldMeta


class BaseReadSchema(BaseModel):
    """
    Frontend requires camelCasing
    Database use convential snake_casing
    """

    model_config = ConfigDict(
        alias_generator=to_camel, populate_by_name=True, from_attributes=True
    )


created_at_meta = FieldMeta(
    description="creation datetime",
    examples=["2024-01-12T10:15:30.000Z"],
)
created_at_annot = Annotated[datetime, created_at_meta.info]

updated_at_meta = FieldMeta(
    description="last update datetime",
    examples=["2024-01-12T10:15:30.000Z"],
)
updated_at_annot = Annotated[datetime, updated_at_meta.info]
