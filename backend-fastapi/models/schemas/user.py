from pydantic import BaseModel, EmailStr

from models.fields import (
    HttpFilters,
    UserAnnotations,
    UserFields,
    UserSelectableFields,
    UserSortableFields,
)
from models.schemas.utils import BaseFiltersSchema
from types_ import FileToUpload, PaginatedData

# --- Base Schemas ----


class UserBaseSchema(BaseModel):
    name: UserAnnotations.name
    email: UserAnnotations.email
    isAdmin: UserAnnotations.isAdmin


class UserSeedSchema(UserBaseSchema):
    ref: int
    password: UserAnnotations.password
    imageUrl: UserAnnotations.imageUrl | None = None


# --- Creation Schemas ---


class UserCreateSchema(UserBaseSchema):
    password: UserAnnotations.password
    imageUrl: UserAnnotations.imageUrl | None = None


class UserPostSchema(UserBaseSchema):
    password: UserAnnotations.password
    image: UserAnnotations.image | None = None


# --- Multipart Post ----


class UserMultipartPost:
    def __init__(
        self,
        name: str = UserFields.name.multipart,
        email: EmailStr = UserFields.email.multipart,
        isAdmin: bool = UserFields.isAdmin.multipart,
        password: str = UserFields.password.multipart,
        image: FileToUpload | None = UserFields.password.multipart,
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


class UserReadSchema(UserBaseSchema):
    id: UserAnnotations.id
    imageUrl: UserAnnotations.imageUrl | None = None
    places: UserAnnotations.places


UsersPaginatedSchema = PaginatedData[UserReadSchema]


# --- Query Schemas ---


class UserFiltersSchema(BaseFiltersSchema[UserSelectableFields, UserSortableFields]):
    id: HttpFilters[UserAnnotations.id]
    name: HttpFilters[UserAnnotations.name]
    email: HttpFilters[UserAnnotations.email]


# --- Update Schemas ---


class UserUpdateSchema(BaseModel):
    name: UserAnnotations.name | None = None
    email: UserAnnotations.email | None = None
    password: UserAnnotations.password | None = None


class UserPutSchema(UserUpdateSchema):
    pass
