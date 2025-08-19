from typing import Annotated, Literal

from fastapi import File, Form
from pydantic import BaseModel, EmailStr, Field

from models.schemas.user import UserFields, UserMultipartFields
from types_ import FileToUpload

# --- Fields ----

access_token_field = Annotated[
    str,
    Field(
        description="A generated web token. The 'Bearer ' prefix needs to be added for authentication",
        examples=[
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM"
        ],
    ),
]

expires_in_field = Annotated[
    int,
    Field(description="The UNIX timestamp the token expires at", examples=[1751879562]),
]

# --- Token ----


class TokenPayload(BaseModel):
    userId: UserFields.id
    email: UserFields.email


# --- Signup Schemas ----


class SignupForm:
    def __init__(
        self,
        name: str = UserMultipartFields.name,
        email: EmailStr = UserMultipartFields.email,
        password: str = UserMultipartFields.password,
        image: FileToUpload | None = UserMultipartFields.image,
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
        username: str = Form(
            ...,
            description="The user email",
            examples=["mslimbeji@gmail.com"],
        ),
        password: str = Form(
            ...,
            min_length=8,
            description="The user password, 8 characters at least",
            examples=["very_secret"],
        ),
    ):
        self.username = username
        self.password = password


# --- Response Schemas ----


class EncodedTokenSchema(BaseModel):
    access_token: access_token_field
    token_type: Literal["bearer"]
    userId: UserFields.id
    email: UserFields.email
    expires_in: expires_in_field
