from typing import TYPE_CHECKING, Awaitable, cast

from beanie import Delete, Insert, PydanticObjectId, after_event, before_event

from lib.types_ import ChangeEvent
from models.collections.base import (
    BaseDocument,
    CollectionEnum,
    document_registry,
)
from models.fields import place as PlaceFields

if TYPE_CHECKING:
    # Avoid Circular imports
    from models.collections.user import User


class Place(BaseDocument):
    # Fields
    title: PlaceFields.title_annot
    description: PlaceFields.description_annot
    imageUrl: PlaceFields.imageUrl_annot | None = None
    address: PlaceFields.address_annot
    location: PlaceFields.Location | None = None
    embedding: PlaceFields.embedding_annot | None = None

    # Relations
    creatorId: PydanticObjectId

    class Settings:
        name = CollectionEnum.PLACES
        indexes = ["createdAt"]

    @before_event(ChangeEvent)
    async def validate_creator_exists(self) -> None:
        Users = cast(type["User"], document_registry[CollectionEnum.USERS])
        if not await Users.find_one(Users.id == self.creatorId):
            raise ValueError("Creator does not exist")

    @after_event([Insert])
    async def add_place_to_user(self) -> None:
        Users = cast(type["User"], document_registry[CollectionEnum.USERS])
        query = Users.find_one(Users.id == self.creatorId).update(
            {"$addToSet": {"places": self.id}}
        )
        await cast(Awaitable, query)

    @before_event([Delete])
    async def remove_place_from_user(self) -> None:
        Users = cast(type["User"], document_registry[CollectionEnum.USERS])
        query = Users.find_one(Users.id == self.creatorId).update(
            {"$pull": {"places": self.id}}
        )
        await cast(Awaitable, query)


document_registry[CollectionEnum.PLACES] = Place
