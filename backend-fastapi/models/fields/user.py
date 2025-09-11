from typing import Annotated, Literal

from beanie.odm.fields import PydanticObjectId
from pydantic import EmailStr

from models.fields.base import FieldMeta
from types_ import FileToUpload

type UserSelectableFields = Literal[
    "id", "name", "email", "isAdmin", "imageUrl", "places"
]

type UserSearchableFields = Literal["id", "name", "email"]

type UserSortableFields = Literal[
    "createdAt", "-createdAt", "name", "-name", "email", "-email"
]


class UserFields:
    id = FieldMeta(
        description="The User ID",
        examples=["683b21134e2e5d46978daf1f"],
    )
    name = FieldMeta(
        min_length=2,
        description="The user name, two characters at least",
        examples=["Slim Beji"],
        json_schema_extra=dict(filter_example="eq:Slim Beji"),
    )
    email = FieldMeta(
        description="The user email",
        examples=["mslimbeji@gmail.com"],
        json_schema_extra=dict(filter_example="eq:mslimbeji@gmail.com"),
    )
    password = FieldMeta(
        min_length=8,
        description="The user password, 8 characters at least",
        examples=["very_secret"],
    )
    imageUrl = FieldMeta(
        examples=["avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg"],
        description="local url on the storage",
    )
    image = FieldMeta(is_file=True, description="The user profile image")
    isAdmin = FieldMeta(
        description="Whether the user is an admin or not",
        examples=[False],
    )
    places = FieldMeta(
        description="The id of places belonging to the user, 24 characters"
    )


class UserAnnotations:
    id = Annotated[PydanticObjectId, UserFields.id.info]
    name = Annotated[str, UserFields.name.info]
    email = Annotated[EmailStr, UserFields.email.info]
    password = Annotated[str, UserFields.password.info]
    imageUrl = Annotated[str, UserFields.imageUrl.info]
    image = Annotated[FileToUpload, UserFields.image.info]
    isAdmin = Annotated[bool, UserFields.isAdmin.info]
    places = Annotated[
        list[
            Annotated[
                PydanticObjectId,
                FieldMeta(
                    description="The Place ID", examples=["683b21134e2e5d46978daf1f"]
                ).info,
            ]
        ],
        UserFields.places.info,
    ]
