from typing import TYPE_CHECKING, cast

from beanie import Delete, Link, after_event
from beanie.odm.fields import ExpressionField

from models.collections.base import BaseDocument, document_registry
from models.schemas import UserFields
from types_ import Collections

if TYPE_CHECKING:
    # Avoid Circular imports
    from models.collections.place import Place


class User(BaseDocument):
    # Fields
    name: UserFields.name
    email: UserFields.email
    password: UserFields.password
    imageUrl: UserFields.image_url | None = None
    isAdmin: UserFields.is_admin

    # Relations
    places: list["Link[Place]"] = []

    class Settings:
        name = Collections.USERS
        indexes = ["createdAt"]

    @after_event([Delete])
    async def remove_child_places(self) -> None:
        Places: type["Place"] = document_registry[Collections.PLACES]
        creatorExpression = cast(ExpressionField, Places.creatorId)
        await Places.find(creatorExpression.id == self.id).delete()


document_registry[Collections.USERS] = User
