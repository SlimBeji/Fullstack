from typing import TYPE_CHECKING

from beanie import Delete, Insert, PydanticObjectId, after_event, before_event

from models.collections.base import BaseDocument, document_registry
from models.fields import PlaceAnnotations
from models.schemas.place import PlaceLocation
from types_ import ChangeEvent, Collections

if TYPE_CHECKING:
    # Avoid Circular imports
    from models.collections.user import User


class Place(BaseDocument):
    # Fields
    title: PlaceAnnotations.title
    description: PlaceAnnotations.description
    imageUrl: PlaceAnnotations.imageUrl | None = None
    address: PlaceAnnotations.address
    location: PlaceLocation | None = None
    embedding: PlaceAnnotations.embedding | None = None

    # Relations
    creatorId: PydanticObjectId

    class Settings:
        name = Collections.PLACES
        indexes = ["createdAt"]

    @before_event(ChangeEvent)
    async def validate_creator_exists(self) -> None:
        Users: type["User"] = document_registry[Collections.USERS]
        if not await Users.find_one(Users.id == self.creatorId):
            raise ValueError("Creator does not exist")

    @after_event([Insert])
    async def add_place_to_user(self) -> None:
        Users: type["User"] = document_registry[Collections.USERS]
        await Users.find_one(Users.id == self.creatorId).update(
            {"$addToSet": {"places": self.id}}
        )

    @before_event([Delete])
    async def remove_place_from_user(self) -> None:
        Users: type["User"] = document_registry[Collections.USERS]
        await Users.find_one(Users.id == self.creatorId).update(
            {"$pull": {"places": self.id}}
        )


document_registry[Collections.PLACES] = Place
