from typing import TYPE_CHECKING, cast

from beanie import Delete, PydanticObjectId, after_event
from pymongo import ASCENDING, IndexModel

from models.collections.base import (
    BaseDocument,
    CollectionEnum,
    document_registry,
)
from models.fields import user as UserFilds

if TYPE_CHECKING:
    # Avoid Circular imports
    from models.collections.place import Place


class User(BaseDocument):
    # Fields
    name: UserFilds.name_annot
    email: UserFilds.email_annot
    password: UserFilds.password_annot
    imageUrl: UserFilds.imageUrl_annot | None = None
    isAdmin: UserFilds.isAdmin_annot

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
