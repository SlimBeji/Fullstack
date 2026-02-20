from typing import Annotated, Literal

from jose import ExpiredSignatureError, JWTError
from pydantic import BaseModel, EmailStr

from config import settings
from lib.pydantic_ import FieldMeta
from lib.types_ import FileToUpload
from lib.utils import decode_payload, encode_payload

from . import user

# --- Fields ----

username_meta = FieldMeta(
    description="The user email (We use username here because of OAuth spec)",
    examples=["mslimbeji@gmail.com"],
)
username_annot = Annotated[str, username_meta.info]


access_token_meta = FieldMeta(
    description="A generated web token. The 'Bearer ' prefix needs to be added for authentication",
    examples=[
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODIyNDVhOWY2YTU5ZjVlNjM2Y2NmYjEiLCJlbWFpbCI6ImJlamkuc2xpbUB5YWhvby5mciIsImlhdCI6MTc0NzMzNjUxMCwiZXhwIjoxNzQ3MzQwMTEwfQ.C4DCJKvGWhpHClpqmxHyxKLPYDOZDUlr-LA_2IflTXM"
    ],
)
access_token_annot = Annotated[str, access_token_meta.info]


expires_in_meta = FieldMeta(
    description="The UNIX timestamp the token expires at", examples=[1751879562]
)
expires_in_annot = Annotated[int, expires_in_meta.info]


# --- Token ----


class TokenPayload(BaseModel):
    userId: user.id_annot
    email: user.email_annot


class InvalidToken(Exception):
    pass


class ExpiredToken(Exception):
    pass


def decode_token(encoded: str) -> TokenPayload:
    try:
        data = decode_payload(encoded, settings.SECRET_KEY)
        return TokenPayload(**data)
    except ExpiredSignatureError:
        raise ExpiredToken("The token has expired")
    except JWTError:
        raise InvalidToken("The token is invalid")


# --- Signup Schemas ----


class SignupForm:
    def __init__(
        self,
        name: str = user.name_meta.multipart,
        email: EmailStr = user.email_meta.multipart,
        password: str = user.password_meta.multipart,
        image: FileToUpload | None = user.image_meta.multipart,
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
        username: str = username_meta.multipart,
        password: str = user.password_meta.multipart,
    ):
        self.username = username
        self.password = password


# --- Response Schemas ----


class EncodedTokenSchema(BaseModel):
    access_token: access_token_annot
    token_type: Literal["bearer"]
    userId: user.id_annot
    email: user.email_annot
    expires_in: expires_in_annot


def create_token(user_id: int, email: str) -> EncodedTokenSchema:
    payload = TokenPayload(userId=user_id, email=email)
    expires_in = settings.JWT_EXPIRATION
    access_token = encode_payload(
        payload.model_dump(fallback=str), settings.SECRET_KEY, expires_in
    )
    return EncodedTokenSchema(
        access_token=access_token,
        token_type="bearer",
        userId=user_id,
        email=email,
        expires_in=expires_in,
    )
