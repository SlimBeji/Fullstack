from typing import TYPE_CHECKING, Awaitable, cast

from beanie import Delete, Insert, PydanticObjectId, after_event, before_event

from models.collections.base import BaseDocument, document_registry
from models.fields import place as PlaceFields
from types_ import ChangeEvent, Collections

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
        name = Collections.PLACES
        indexes = ["createdAt"]

    @before_event(ChangeEvent)
    async def validate_creator_exists(self) -> None:
        Users = cast(type["User"], document_registry[Collections.USERS])
        if not await Users.find_one(Users.id == self.creatorId):
            raise ValueError("Creator does not exist")

    @after_event([Insert])
    async def add_place_to_user(self) -> None:
        Users = cast(type["User"], document_registry[Collections.USERS])
        query = Users.find_one(Users.id == self.creatorId).update(
            {"$addToSet": {"places": self.id}}
        )
        await cast(Awaitable, query)

    @before_event([Delete])
    async def remove_place_from_user(self) -> None:
        Users = cast(type["User"], document_registry[Collections.USERS])
        query = Users.find_one(Users.id == self.creatorId).update(
            {"$pull": {"places": self.id}}
        )
        await cast(Awaitable, query)


document_registry[Collections.PLACES] = Place
