from typing import Literal

from pydantic import BaseModel, EmailStr

from lib.types_ import FileToUpload
from models.fields import auth as AuthFields
from models.fields import user as UserFields

# --- Token ----


class TokenPayload(BaseModel):
    userId: UserFields.id_annot
    email: UserFields.email_annot


# --- Signup Schemas ----


class SignupForm:
    def __init__(
        self,
        name: str = UserFields.name_meta.multipart,
        email: EmailStr = UserFields.email_meta.multipart,
        password: str = UserFields.password_meta.multipart,
        image: FileToUpload | None = UserFields.image_meta.multipart,
    ):
        self.name = name
        self.email = email
        self.password = password
        self.image = image or None

    def model_dump(self) -> dict:
        return dict(
            name=self.name,
            email=self.email,
            password=self.password,
            image=self.image,
        )


# --- Signin Schemas ----


class SigninForm:
    def __init__(
        self,
        username: str = AuthFields.username_meta.multipart,
        password: str = UserFields.password_meta.multipart,
    ):
        self.username = username
        self.password = password


# --- Response Schemas ----


class EncodedTokenSchema(BaseModel):
    access_token: AuthFields.access_token_annot
    token_type: Literal["bearer"]
    userId: UserFields.id_annot
    email: UserFields.email_annot
    expires_in: AuthFields.expires_in_annot
