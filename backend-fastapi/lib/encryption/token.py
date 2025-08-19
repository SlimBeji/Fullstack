import time

from jose import ExpiredSignatureError, JWTError

from config import settings
from lib.encryption.helpers import decode_payload, encode_payload
from models.schemas import EncodedTokenSchema, TokenPayload, UserReadSchema


class InvalidToken(Exception):
    pass


class ExpiredToken(Exception):
    pass


def decode_token(encoded: str) -> TokenPayload:
    try:
        data = decode_payload(encoded)
        return TokenPayload(**data)
    except ExpiredSignatureError:
        raise ExpiredToken("The token has expired")
    except JWTError:
        raise InvalidToken("The token is invalid")


def create_token(user: UserReadSchema) -> EncodedTokenSchema:
    payload = TokenPayload(userId=user.id, email=user.email)
    access_token = encode_payload(payload.model_dump(fallback=str))
    expires_in = settings.JWT_EXPIRATION
    return EncodedTokenSchema(
        access_token=access_token,
        token_type="bearer",
        userId=user.id,
        email=user.email,
        expires_in=expires_in,
    )
