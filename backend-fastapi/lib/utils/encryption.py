from datetime import UTC, datetime, timedelta
from typing import Literal

import bcrypt
from jose import jwt

SIGNING_ALGORITHM = "HS256"

AcceptedEncodings = Literal["utf-8"]


def hash_input(
    input_: str, hash_salt: int, encoding: AcceptedEncodings = "utf-8"
) -> str:
    salt = bcrypt.gensalt(rounds=hash_salt)
    return bcrypt.hashpw(input_.encode(encoding), salt).decode(encoding)


def verify_hash(
    plain: str, hashed: str, encoding: AcceptedEncodings = "utf-8"
) -> bool:
    return bcrypt.checkpw(plain.encode(encoding), hashed.encode(encoding))


def encode_payload(payload: dict, secret: str, expires_in: int) -> str:
    payload = payload.copy()
    now = datetime.now(UTC)
    payload.update(dict(iat=now, exp=now + timedelta(seconds=expires_in)))
    return jwt.encode(payload, secret, algorithm=SIGNING_ALGORITHM)


def decode_payload(encoded: str, secret: str) -> dict:
    return jwt.decode(encoded, secret, algorithms=SIGNING_ALGORITHM)
