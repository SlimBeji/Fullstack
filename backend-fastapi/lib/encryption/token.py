from jose import ExpiredSignatureError, JWTError

from config import settings
from lib.utils import decode_payload, encode_payload
from models.schemas import EncodedTokenSchema, TokenPayload, UserReadSchema


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
