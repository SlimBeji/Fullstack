from typing import Literal

import bcrypt

DEFAULT_HASH_SALT = 12

salt = bcrypt.gensalt(rounds=DEFAULT_HASH_SALT)

AcceptedEncodings = Literal["utf-8"]


def hash_input(input_: str, encoding: AcceptedEncodings = "utf-8") -> str:
    return bcrypt.hashpw(input_.encode(encoding), salt).decode(encoding)


def verify_hash(plain: str, hashed: str, encoding: AcceptedEncodings = "utf-8") -> bool:
    return bcrypt.checkpw(plain.encode(encoding), hashed.encode(encoding))
