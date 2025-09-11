from typing import Literal

from pydantic import BaseModel, EmailStr

from models.fields import AuthAnnotations, UserAnnotations, UserFields
from types_ import FileToUpload

# --- Token ----


class TokenPayload(BaseModel):
    userId: UserAnnotations.id
    email: UserAnnotations.email


# --- Signup Schemas ----


class SignupForm:
    def __init__(
        self,
        name: str = UserFields.name.multipart,
        email: EmailStr = UserFields.email.multipart,
        password: str = UserFields.password.multipart,
        image: FileToUpload | None = UserFields.image.multipart,
    ):
        self.name = name
        self.email = email
        self.password = password
        self.image = image or None

    def model_dump(self) -> dict:
        return dict(
            name=self.name, email=self.email, password=self.password, image=self.image
        )


# --- Signin Schemas ----


class SigninForm:
    def __init__(
        self,
        username: str = UserFields.email.multipart,
        password: str = UserFields.password.multipart,
    ):
        self.username = username
        self.password = password


# --- Response Schemas ----


class EncodedTokenSchema(BaseModel):
    access_token: AuthAnnotations.access_token
    token_type: Literal["bearer"]
    userId: UserAnnotations.id
    email: UserAnnotations.email
    expires_in: AuthAnnotations.expires_in
