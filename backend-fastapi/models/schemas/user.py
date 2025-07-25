from typing import Annotated

from fastapi import File, UploadFile
from pydantic import BaseModel, EmailStr, Field

from models.schemas.utils import id_metadata

# --- Fields ----

user_id_field = Annotated[
    str,
    Field(**id_metadata()),
]

user_name_field = Annotated[
    str,
    Field(
        min_length=2,
        description="The user name, two characters at least",
        example="Slim Beji",
    ),
]

user_email_field = Annotated[
    EmailStr,
    Field(
        description="The user email",
        example="mslimbeji@gmail.com",
    ),
]

user_password_field = Annotated[
    str,
    Field(
        min_length=8,
        description="The user password, 8 characters at least",
        example="very_secret",
    ),
]

user_image_url_field = Annotated[
    str,
    Field(
        example="avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg",
        description="local url on the storage",
    ),
]

user_image_field = Annotated[
    UploadFile,
    File(description="The user profile image"),
]

user_is_admin_field = Annotated[
    bool,
    Field(
        description="Whether the user is an admin or not",
        example=False,
    ),
]

user_places_field = Annotated[
    list[Annotated[str, Field(**id_metadata())]],
    Field(description="The id of places belonging to the user, 24 characters"),
]


# --- DB Schemas ----


class UserBaseSchema(BaseModel):
    name: user_name_field
    email: user_email_field
    isAdmin: user_is_admin_field


class UserDBSchema(UserBaseSchema):
    id: user_id_field
    password: user_password_field
    imageUrl: user_image_url_field | None = None
    places: user_places_field


class UserSeedSchema(UserBaseSchema):
    _ref: int
    password: user_password_field
    imageUrl: user_image_url_field | None = None


# --- Creation Schemas ---


class UserCreateSchema(UserBaseSchema):
    password: user_password_field
    imageUrl: user_image_url_field | None = None


class UserPostSchema(UserBaseSchema):
    password: user_password_field
    image: user_image_field | None = None


# --- Read Schemas ---


class UserReadSchema(UserBaseSchema):
    id: user_id_field
    imageUrl: user_image_url_field | None = None
    places: user_places_field


# --- Update Schemas ---


class UserUpdateSchema(BaseModel):
    name: user_name_field | None = None
    email: user_email_field | None = None
    isAdmin: user_is_admin_field | None = None


class UserPutSchema(UserUpdateSchema):
    pass
