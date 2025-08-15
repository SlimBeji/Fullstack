import time
from typing import Literal

import bcrypt
from jose import ExpiredSignatureError, JWTError, jwt

from config import settings
from models.schemas import EncodedTokenSchema, TokenPayload, UserReadSchema

DEFAULT_HASH_SALT = 12
SIGNING_ALGORITHM = "HS256"

salt = bcrypt.gensalt(rounds=DEFAULT_HASH_SALT)

AcceptedEncodings = Literal["utf-8"]


def hash_input(input_: str, encoding: AcceptedEncodings = "utf-8") -> str:
    return bcrypt.hashpw(input_.encode(encoding), salt).decode(encoding)


def verify_hash(plain: str, hashed: str, encoding: AcceptedEncodings = "utf-8") -> bool:
    return bcrypt.checkpw(plain.encode(encoding), hashed.encode(encoding))


def sign_payload(payload: TokenPayload) -> str:
    data = payload.model_dump(fallback=str)
    return jwt.encode(data, settings.SECRET_KEY, algorithm=SIGNING_ALGORITHM)


def create_token(user: UserReadSchema) -> EncodedTokenSchema:
    payload = TokenPayload(userId=user.id, email=user.email)
    access_token = sign_payload(payload)
    expires_in = int(time.time()) + settings.JWT_EXPIRATION
    return EncodedTokenSchema(
        access_token=access_token,
        token_type="bearer",
        userId=user.id,
        email=user.email,
        expires_in=expires_in,
    )


class InvalidToken(Exception):
    pass


class ExpiredToken(Exception):
    pass


def decode_token(encoded: str) -> TokenPayload:
    try:
        data = jwt.decode(encoded, settings.SECRET_KEY, algorithms=SIGNING_ALGORITHM)
        return TokenPayload(**data)
    except ExpiredSignatureError:
        raise ExpiredToken("The token has expired")
    except JWTError:
        raise InvalidToken("The token is invalid")
