from typing import Annotated, Any

from beanie import Link
from beanie.odm.fields import PydanticObjectId
from bson import ObjectId
from pydantic import BeforeValidator


def link_object_id_validator(value: Any) -> PydanticObjectId:
    if isinstance(value, Link):
        return PydanticObjectId(value.ref.id)
    elif isinstance(value, ObjectId):
        return PydanticObjectId(value)
    elif isinstance(value, str) and ObjectId.is_valid(value):
        return PydanticObjectId(value)
    raise ValueError(f"Invalid value for LinkedObjectId: {value}")


LinkedObjectId = Annotated[
    PydanticObjectId,
    BeforeValidator(link_object_id_validator),
]
