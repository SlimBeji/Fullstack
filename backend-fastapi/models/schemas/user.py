from pydantic import BaseModel, EmailStr

from lib.types_ import FileToUpload, FindQuery, PaginatedData
from models.fields import (
    HttpFilters,
    UserSearchableFields,
    UserSelectableFields,
    UserSortableFields,
)
from models.fields import user as UserFields
from models.schemas.base import BaseFiltersSchema

# --- Base Schemas ----


class UserSeedSchema(BaseModel):
    ref: int
    name: UserFields.name_annot
    email: UserFields.email_annot
    isAdmin: UserFields.isAdmin_annot
    password: UserFields.password_annot
    imageUrl: UserFields.imageUrl_annot | None = None


# --- Creation Schemas ---


class UserCreateSchema(BaseModel):
    name: UserFields.name_annot
    email: UserFields.email_annot
    isAdmin: UserFields.isAdmin_annot
    password: UserFields.password_annot
    imageUrl: UserFields.imageUrl_annot | None = None


class UserPostSchema(BaseModel):
    name: UserFields.name_annot
    email: UserFields.email_annot
    isAdmin: UserFields.isAdmin_annot
    password: UserFields.password_annot
    image: UserFields.image_annot | None = None


class UserMultipartPost:
    def __init__(
        self,
        name: str = UserFields.name_meta.multipart,
        email: EmailStr = UserFields.email_meta.multipart,
        isAdmin: bool = UserFields.isAdmin_meta.multipart,
        password: str = UserFields.password_meta.multipart,
        image: FileToUpload | None = UserFields.image_meta.multipart,
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
    id: UserFields.id_annot
    name: UserFields.name_annot
    email: UserFields.email_annot
    isAdmin: UserFields.isAdmin_annot
    imageUrl: UserFields.imageUrl_annot | None = None
    places: UserFields.places_annot


UsersPaginatedSchema = PaginatedData[UserReadSchema]


# --- Query Schemas ---


class UserFiltersSchema(
    BaseFiltersSchema[UserSelectableFields, UserSortableFields]
):
    id: HttpFilters[UserFields.id_annot]
    name: HttpFilters[UserFields.name_annot]
    email: HttpFilters[UserFields.email_annot]


UserFindQuery = FindQuery[
    UserSelectableFields, UserSortableFields, UserSearchableFields
]

# --- Update Schemas ---


class UserUpdateSchema(BaseModel):
    name: UserFields.name_annot | None = None
    email: UserFields.email_annot | None = None
    password: UserFields.password_annot | None = None


class UserPutSchema(UserUpdateSchema):
    pass
