from typing import TYPE_CHECKING

from beanie import Link

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


document_registry[Collections.USERS] = User
