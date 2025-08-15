from typing import Annotated

from fastapi import Form
from pydantic import BaseModel, Field

from models.schemas.user import UserFields

# --- Fields ----

token_field = Annotated[
    str,
    Field(
        description="A generated web token. The 'Bearer ' prefix needs to be added for authentication",
        examples=[
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM"
        ],
    ),
]

expires_at_field = Annotated[
    int,
    Field(description="The UNIX timestamp the token expires at", examples=[1751879562]),
]

# --- Signup Schemas ----


class SignupSchema(BaseModel):
    name: UserFields.name
    email: UserFields.email
    password: UserFields.password
    image: UserFields.image | None = None


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
    userId: UserFields.id
    email: UserFields.email
    token: token_field
    expiresAt: expires_at_field
