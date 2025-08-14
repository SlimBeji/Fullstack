import time

from models.schemas import EncodedTokenSchema, UserReadSchema


def create_token(user: UserReadSchema) -> EncodedTokenSchema:
    return EncodedTokenSchema(
        userId=user.id,
        email=user.email,
        token=f"__TOKEN_FOR_USER_{user.email}__",
        expiresAt=int(time.time()),
    )
