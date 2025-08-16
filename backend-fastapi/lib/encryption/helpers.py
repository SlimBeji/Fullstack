from typing import Literal

import bcrypt
from jose import jwt

from config import settings

DEFAULT_HASH_SALT = 12
SIGNING_ALGORITHM = "HS256"

salt = bcrypt.gensalt(rounds=DEFAULT_HASH_SALT)

AcceptedEncodings = Literal["utf-8"]


def hash_input(input_: str, encoding: AcceptedEncodings = "utf-8") -> str:
    return bcrypt.hashpw(input_.encode(encoding), salt).decode(encoding)


def verify_hash(plain: str, hashed: str, encoding: AcceptedEncodings = "utf-8") -> bool:
    return bcrypt.checkpw(plain.encode(encoding), hashed.encode(encoding))


def encode_payload(payload: dict) -> str:
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=SIGNING_ALGORITHM)


def decode_payload(encoded: str) -> dict:
    return jwt.decode(encoded, settings.SECRET_KEY, algorithms=SIGNING_ALGORITHM)
