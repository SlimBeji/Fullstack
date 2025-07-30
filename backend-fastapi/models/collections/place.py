from typing import TYPE_CHECKING, Type

from beanie import Delete, Insert, Link, after_event, before_event

from models.collections.base import BaseDocument, document_registry
from models.schemas.place import PlaceFields
from types_ import ChangeEvent, Collections

if TYPE_CHECKING:
    # Avoid Circular imports
    from models.collections.user import User


class Place(BaseDocument):
    # Fields
    title: PlaceFields.title
    description: PlaceFields.description
    imageUrl: PlaceFields.image_url | None = None
    address: PlaceFields.address
    location: PlaceFields.Location | None = None
    embedding: PlaceFields.embedding = []

    # Relations
    creatorId: "Link[User]"

    class Settings:
        name = Collections.PLACES
        indexes = ["createdAt"]

    @before_event(ChangeEvent)
    async def validate_creator_exists(self) -> None:
        Users: Type["User"] = document_registry[Collections.USERS]
        if not await Users.find_one(Users.id == self.creatorId.ref.id):
            raise ValueError("Creator does not exist")

    @after_event([Insert])
    async def add_place_to_user(self) -> None:
        Users: Type["User"] = document_registry[Collections.USERS]
        await Users.find_one(Users.id == self.creatorId.ref.id).update(
            {"$addToSet": {"places": self.id}}
        )

    @before_event([Delete])
    async def remove_place_from_user(self) -> None:
        Users: Type["User"] = document_registry[Collections.USERS]
        await Users.find_one(Users.id == self.creatorId.ref.id).update(
            {"$pull": {"places": self.id}}
        )


document_registry[Collections.PLACES] = Place
