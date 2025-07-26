from typing import Annotated

from pydantic import BaseModel, Field

from models.schemas.user import (
    user_email_field,
    user_id_field,
    user_image_field,
    user_name_field,
    user_password_field,
)

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
    name: user_name_field
    email: user_email_field
    password: user_password_field
    image: user_image_field | None = None


# --- Signin Schemas ----


class SigninSchema(BaseModel):
    email: user_email_field
    password: user_password_field


# --- Response Schemas ----


class EncodedTokenSchema(BaseModel):
    userId: user_id_field
    email: user_email_field
    token: token_field
    expires_at: user_image_field
