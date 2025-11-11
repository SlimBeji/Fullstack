from http import HTTPStatus

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from lib.encryption import ExpiredToken, InvalidToken, decode_token
from models.crud import crud_user
from models.schemas import UserReadSchema
from types_ import ApiError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/signin")


async def get_user_from_token(token: str) -> UserReadSchema:
    try:
        payload = decode_token(token)
    except ExpiredToken:
        raise ApiError(HTTPStatus.UNAUTHORIZED, "Token Expired")
    except InvalidToken:
        raise ApiError(HTTPStatus.UNAUTHORIZED, "Token Not Valid")

    user = await crud_user.get(payload.userId)
    if user is None:
        raise ApiError(HTTPStatus.NOT_FOUND, "User Not Found")

    if user.email != payload.email:
        raise ApiError(HTTPStatus.BAD_REQUEST, "Token Corrupt")

    return user


async def get_current_user(
    token: str = Depends(oauth2_scheme),
) -> UserReadSchema:
    return await get_user_from_token(token)


async def get_current_admin(
    token: str = Depends(oauth2_scheme),
) -> UserReadSchema:
    user = await get_user_from_token(token)
    if not user.isAdmin:
        raise ApiError(HTTPStatus.UNAUTHORIZED, "Only admins are allowed")
    return user
