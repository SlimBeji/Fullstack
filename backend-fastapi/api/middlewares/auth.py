from http import HTTPStatus

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from lib.fastapi_ import ApiError
from models.cruds import CrudsUser
from models.schemas import (
    ExpiredToken,
    InvalidToken,
    UserReadSchema,
    decode_token,
)

from .session import get_session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/signin")


async def _get_user_from_token(
    session: AsyncSession, token: str
) -> UserReadSchema:
    try:
        payload = decode_token(token)
    except ExpiredToken:
        raise ApiError(HTTPStatus.UNAUTHORIZED, "Token Expired")
    except InvalidToken:
        raise ApiError(HTTPStatus.UNAUTHORIZED, "Token Not Valid")

    cruds = CrudsUser(session)
    user = await cruds.get(payload.userId)
    if user is None:
        raise ApiError(HTTPStatus.NOT_FOUND, "User Not Found")

    if user.email != payload.email:
        raise ApiError(HTTPStatus.BAD_REQUEST, "Token Corrupt")

    return user


async def get_current_user(
    session: AsyncSession = Depends(get_session),
    token: str = Depends(oauth2_scheme),
) -> UserReadSchema:
    return await _get_user_from_token(session, token)


async def get_current_admin(
    session: AsyncSession = Depends(get_session),
    token: str = Depends(oauth2_scheme),
) -> UserReadSchema:
    user = await _get_user_from_token(session, token)
    if not user.isAdmin:
        raise ApiError(HTTPStatus.UNAUTHORIZED, "Only admins are allowed")
    return user
