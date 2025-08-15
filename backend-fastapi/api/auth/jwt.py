import time

from config import settings
from lib.utils import sign_payload
from models.schemas import EncodedTokenSchema, TokenPayload, UserReadSchema


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
