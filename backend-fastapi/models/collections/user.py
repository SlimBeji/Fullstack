from typing import TYPE_CHECKING

from beanie import Delete, PydanticObjectId, after_event

from models.collections.base import BaseDocument, document_registry
from models.fields import UserAnnotations
from types_ import Collections

if TYPE_CHECKING:
    # Avoid Circular imports
    from models.collections.place import Place


class User(BaseDocument):
    # Fields
    name: UserAnnotations.name
    email: UserAnnotations.email
    password: UserAnnotations.password
    imageUrl: UserAnnotations.imageUrl | None = None
    isAdmin: UserAnnotations.isAdmin

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
