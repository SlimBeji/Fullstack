from datetime import datetime
from typing import Annotated

from lib.pydantic_ import FieldMeta

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
