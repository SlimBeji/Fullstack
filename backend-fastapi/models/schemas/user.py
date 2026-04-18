from typing import Annotated, Literal

from pydantic import BaseModel, EmailStr, Field

from config import settings
from lib.pydantic_ import BaseSearchSchema, FieldMeta, HttpFilters
from lib.types_ import FileToUpload, PaginatedData, PaginatedDict, SearchQuery

from .common import created_at_annot

# --- Fields ----

id_meta = FieldMeta(
    description="The User ID", examples=[123456789], is_index=True
)
id_annot = Annotated[int, id_meta.info]

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

image_url_meta = FieldMeta(
    examples=["avatar2_80e32f88-c9a5-4fcd-8a56-76b5889440cd.jpg"],
    description="image url",
)
image_url_annot = Annotated[str, image_url_meta.info]

image_meta = FieldMeta(is_file=True, description="The user profile image")
image_annot = Annotated[FileToUpload, image_meta.info]

is_admin_meta = FieldMeta(
    description="Whether the user is an admin or not",
    examples=[False],
)
is_admin_annot = Annotated[bool, is_admin_meta.info]


class UserPlace(BaseModel):
    id: Annotated[int, Field(description="The place ID", examples=[123456789])]
    title: Annotated[
        str, Field(description="The place title", examples=["Stamford Bridge"])
    ]
    address: Annotated[
        str, Field(description="The place address", examples=["Fulham road"])
    ]


places_meta = FieldMeta(description="The user places")
places_annot = Annotated[list[UserPlace], places_meta.info]

# --- Selectables, Serchables, Sortables ----

UserSelectableFields = Literal[
    "id", "name", "email", "is_admin", "image_url", "places", "created_at"
]

UserSearchableFields = Literal["id", "name", "email", "created_at"]

UserSortableFields = Literal[
    "created_at", "-created_at", "name", "-name", "email", "-email"
]

# --- Base Schemas ----


class UserSeedSchema(BaseModel):
    ref: int
    name: name_annot
    email: email_annot
    is_admin: is_admin_annot
    password: password_annot
    image_url: image_url_annot | None = None


# --- Creation Schemas ---


class UserCreateSchema(BaseModel):
    name: name_annot
    email: email_annot
    is_admin: is_admin_annot
    password: password_annot
    image_url: image_url_annot | None = None


class UserPostSchema(BaseModel):
    name: name_annot
    email: email_annot
    is_admin: is_admin_annot
    password: password_annot
    image: image_annot | None = None


class UserMultipartPost:
    def __init__(
        self,
        name: str = name_meta.multipart,
        email: EmailStr = email_meta.multipart,
        is_admin: bool = is_admin_meta.multipart,
        password: str = password_meta.multipart,
        image: FileToUpload | None = image_meta.optional_multipart,
    ):
        self.name = name
        self.email = email
        self.is_admin = is_admin
        self.password = password
        self.image = image or None

    def to_post_schema(self) -> UserPostSchema:
        return UserPostSchema(
            name=self.name,
            email=self.email,
            is_admin=self.is_admin,
            password=self.password,
            image=self.image,
        )


# --- Read Schemas ---


class UserReadSchema(BaseModel):
    id: id_annot
    name: name_annot
    email: email_annot
    is_admin: is_admin_annot
    image_url: image_url_annot | None = None
    places: places_annot
    created_at: created_at_annot


# --- Update Schemas ---


class UserUpdateSchema(BaseModel):
    name: name_annot | None = None
    email: email_annot | None = None
    password: password_annot | None = None


class UserPutSchema(UserUpdateSchema):
    pass


# --- Search Schemas ---

UsersPaginatedSchema = PaginatedData[UserReadSchema] | PaginatedDict


class UserSearchSchema(
    BaseSearchSchema[
        UserSelectableFields, UserSortableFields, UserSearchableFields
    ]
):
    page: Annotated[int, Field(description="The page number")] = 1
    size: Annotated[int, Field(description="Items per page")] = (
        settings.MAX_ITEMS_PER_PAGE
    )
    sort: Annotated[
        list[UserSortableFields] | None,
        Field(
            description="Fields to use for sorting. Use '-' for descending",
            json_schema_extra={"examples": [["-created_at"]]},
        ),
    ] = None
    fields: Annotated[
        list[UserSelectableFields] | None,
        Field(
            description="Fields to include in the response; omit for complete data",
            json_schema_extra={"examples": ["id", "places"]},
        ),
    ] = None

    id: HttpFilters[id_annot]
    name: HttpFilters[name_annot]
    email: HttpFilters[email_annot]
    created_at: HttpFilters[created_at_annot]


UserSearchQuery = SearchQuery[
    UserSelectableFields, UserSortableFields, UserSearchableFields
]
