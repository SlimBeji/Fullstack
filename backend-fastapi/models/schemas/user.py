from typing import Annotated, Literal

from beanie.odm.fields import PydanticObjectId
from pydantic import BaseModel, EmailStr

from config import settings
from lib.pydantic_ import BaseFiltersSchema, FieldMeta, HttpFilters
from lib.types_ import FileToUpload, FindQuery, PaginatedData

from .common import created_at_annot, updated_at_annot

# --- Fields ----

type UserSelectableFields = Literal[
    "id", "name", "email", "isAdmin", "imageUrl", "places"
]

type UserSearchableFields = Literal["id", "name", "email"]

type UserSortableFields = Literal[
    "createdAt", "-createdAt", "name", "-name", "email", "-email"
]

id_meta = FieldMeta(
    description="The User ID",
    examples=["683b21134e2e5d46978daf1f"],
)
id_annot = Annotated[PydanticObjectId, id_meta.info]

name_meta = FieldMeta(
    min_length=2,
    description="The user name, two characters at least",
    examples=["Slim Beji"],
    filter_examples=["eq:Slim Beji"],
)
name_annot = Annotated[str, name_meta.info]

email_meta = FieldMeta(
    description="The user email",
    examples=["mslimbeji@gmail.com"],
    filter_examples=["eq:mslimbeji@gmail.com"],
)
email_annot = Annotated[EmailStr, email_meta.info]

password_meta = FieldMeta(
    min_length=8,
    description="The user password, 8 characters at least",
    examples=["very_secret"],
)
password_annot = Annotated[str, password_meta.info]

imageUrl_meta = FieldMeta(
    examples=["avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg"],
    description="local url on the storage",
)
imageUrl_annot = Annotated[str, imageUrl_meta.info]

image_meta = FieldMeta(is_file=True, description="The user profile image")
image_annot = Annotated[FileToUpload, image_meta.info]

isAdmin_meta = FieldMeta(
    description="Whether the user is an admin or not",
    examples=[False],
)
isAdmin_annot = Annotated[bool, isAdmin_meta.info]

places_meta = FieldMeta(
    description="The id of places belonging to the user, 24 characters"
)
places_annot = Annotated[
    list[
        Annotated[
            PydanticObjectId,
            FieldMeta(
                description="The Place ID",
                examples=["683b21134e2e5d46978daf1f"],
            ).info,
        ]
    ],
    places_meta.info,
]


# --- Base Schemas ----


class UserSeedSchema(BaseModel):
    ref: int
    name: name_annot
    email: email_annot
    isAdmin: isAdmin_annot
    password: password_annot
    imageUrl: imageUrl_annot | None = None


# --- Creation Schemas ---


class UserCreateSchema(BaseModel):
    name: name_annot
    email: email_annot
    isAdmin: isAdmin_annot
    password: password_annot
    imageUrl: imageUrl_annot | None = None


class UserPostSchema(BaseModel):
    name: name_annot
    email: email_annot
    isAdmin: isAdmin_annot
    password: password_annot
    image: image_annot | None = None


class UserMultipartPost:
    def __init__(
        self,
        name: str = name_meta.multipart,
        email: EmailStr = email_meta.multipart,
        isAdmin: bool = isAdmin_meta.multipart,
        password: str = password_meta.multipart,
        image: FileToUpload | None = image_meta.multipart,
    ):
        self.name = name
        self.email = email
        self.isAdmin = isAdmin
        self.password = password
        self.image = image or None

    def to_post_schema(self) -> UserPostSchema:
        return UserPostSchema(
            name=self.name,
            email=self.email,
            isAdmin=self.isAdmin,
            password=self.password,
            image=self.image,
        )


# --- Read Schemas ---


class UserReadSchema(BaseModel):
    id: id_annot
    name: name_annot
    email: email_annot
    isAdmin: isAdmin_annot
    imageUrl: imageUrl_annot | None = None
    places: places_annot
    updatedAt: updated_at_annot
    createdAt: created_at_annot


UsersPaginatedSchema = PaginatedData[UserReadSchema]


# --- Query Schemas ---


class UserFiltersSchema(
    BaseFiltersSchema[UserSelectableFields, UserSortableFields]
):
    _MAX_SIZE = settings.MAX_ITEMS_PER_PAGE

    id: HttpFilters[id_annot]
    name: HttpFilters[name_annot]
    email: HttpFilters[email_annot]


UserFindQuery = FindQuery[
    UserSelectableFields, UserSortableFields, UserSearchableFields
]

# --- Update Schemas ---


class UserUpdateSchema(BaseModel):
    name: name_annot | None = None
    email: email_annot | None = None
    password: password_annot | None = None


class UserPutSchema(UserUpdateSchema):
    pass
