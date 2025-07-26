from typing import Annotated

from pydantic import BaseModel, Field

from models.schemas.user import UserFields

# --- Fields ----

token_field = Annotated[
    str,
    Field(
        description="A generated web token. The 'Bearer ' prefix needs to be added for authentication",
        example="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM",
    ),
]

expires_at_field = Annotated[
    int,
    Field(description="The UNIX timestamp the token expires at", example=1751879562),
]

# --- Signup Schemas ----


class SignupSchema(BaseModel):
    name: UserFields.name
    email: UserFields.email
    password: UserFields.password
    image: UserFields.image | None = None


# --- Signin Schemas ----


class SigninSchema(BaseModel):
    email: UserFields.email
    password: UserFields.password


# --- Response Schemas ----


class EncodedTokenSchema(BaseModel):
    userId: UserFields.id
    email: UserFields.email
    token: token_field
    expiresAt: expires_at_field
