from typing import TYPE_CHECKING, cast

from beanie import Delete, PydanticObjectId, after_event
from pymongo import ASCENDING, IndexModel

from models.collections.base import (
    BaseDocument,
    CollectionEnum,
    document_registry,
)

from ..schemas import user

if TYPE_CHECKING:
    # Avoid Circular imports
    from models.collections.place import Place


class User(BaseDocument):
    # Fields
    name: user.name_annot
    email: user.email_annot
    password: user.password_annot
    imageUrl: user.imageUrl_annot | None = None
    isAdmin: user.isAdmin_annot

    # Relations
    places: list[PydanticObjectId] = []

    class Settings:
        name = CollectionEnum.USERS
        indexes = [
            IndexModel([("name", ASCENDING)], unique=True),
            IndexModel([("email", ASCENDING)], unique=True),
            IndexModel([("createdAt", ASCENDING)]),
        ]

    @after_event([Delete])
    async def remove_child_places(self) -> None:
        Places = cast(type["Place"], document_registry[CollectionEnum.PLACES])
        await Places.find(Places.creatorId == self.id).delete()


document_registry[CollectionEnum.USERS] = User
