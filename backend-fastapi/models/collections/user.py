from typing import TYPE_CHECKING

from beanie import Delete, PydanticObjectId, after_event

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
    places: list[PydanticObjectId] = []

    class Settings:
        name = Collections.USERS
        indexes = ["createdAt"]

    @after_event([Delete])
    async def remove_child_places(self) -> None:
        Places: type["Place"] = document_registry[Collections.PLACES]
        await Places.find(Places.creatorId == self.id).delete()


document_registry[Collections.USERS] = User
