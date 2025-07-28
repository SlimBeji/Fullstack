from typing import Annotated

from beanie.odm.fields import PydanticObjectId
from fastapi import File, UploadFile
from pydantic import BaseModel, EmailStr, Field

from types_ import PaginatedData

# --- Fields ----


class UserFields:
    id = Annotated[
        PydanticObjectId,
        Field(description="The User ID", example="683b21134e2e5d46978daf1f"),
    ]
    name = Annotated[
        str,
        Field(
            min_length=2,
            description="The user name, two characters at least",
            example="Slim Beji",
        ),
    ]
    email = Annotated[
        EmailStr,
        Field(
            description="The user email",
            example="mslimbeji@gmail.com",
        ),
    ]
    password = Annotated[
        str,
        Field(
            min_length=8,
            description="The user password, 8 characters at least",
            example="very_secret",
        ),
    ]
    image_url = Annotated[
        str,
        Field(
            example="avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
            description="local url on the storage",
        ),
    ]
    image = Annotated[
        UploadFile,
        File(description="The user profile image"),
    ]
    is_admin = Annotated[
        bool,
        Field(
            description="Whether the user is an admin or not",
            example=False,
        ),
    ]
    places = Annotated[
        list[
            Annotated[
                PydanticObjectId,
                Field(description="The Place ID", example="683b21134e2e5d46978daf1f"),
            ]
        ],
        Field(description="The id of places belonging to the user, 24 characters"),
    ]


# --- Base Schemas ----


class UserBaseSchema(BaseModel):
    name: UserFields.name
    email: UserFields.email
    isAdmin: UserFields.is_admin


class UserSeedSchema(UserBaseSchema):
    _ref: int
    password: UserFields.password
    imageUrl: UserFields.image_url | None = None


# --- Creation Schemas ---


class UserCreateSchema(UserBaseSchema):
    password: UserFields.password
    imageUrl: UserFields.image_url | None = None


class UserPostSchema(UserBaseSchema):
    password: UserFields.password
    image: UserFields.image | None = None


# --- Read Schemas ---


class UserReadSchema(UserBaseSchema):
    id: UserFields.id
    imageUrl: UserFields.image_url | None = None
    places: UserFields.places


UsersPaginatedSchema = PaginatedData[UserReadSchema]

# --- Update Schemas ---


class UserUpdateSchema(BaseModel):
    name: UserFields.name | None = None
    email: UserFields.email | None = None
    isAdmin: UserFields.is_admin | None = None


class UserPutSchema(UserUpdateSchema):
    pass
