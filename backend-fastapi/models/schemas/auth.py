from typing import Literal

from jose import ExpiredSignatureError, JWTError
from pydantic import BaseModel, EmailStr

from config import settings
from lib.types_ import FileToUpload
from lib.utils import decode_payload, encode_payload
from models.fields import auth as AuthFields
from models.fields import user as UserFields
from models.schemas.user import UserReadSchema

# --- Token ----


class TokenPayload(BaseModel):
    userId: UserFields.id_annot
    email: UserFields.email_annot


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


def create_token(user: UserReadSchema) -> EncodedTokenSchema:
    payload = TokenPayload(userId=user.id, email=user.email)
    expires_in = settings.JWT_EXPIRATION
    access_token = encode_payload(
        payload.model_dump(fallback=str), settings.SECRET_KEY, expires_in
    )
    return EncodedTokenSchema(
        access_token=access_token,
        token_type="bearer",
        userId=user.id,
        email=user.email,
        expires_in=expires_in,
    )
