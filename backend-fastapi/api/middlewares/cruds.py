from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from models.cruds import CrudsPlace, CrudsUser

from .session import get_session


async def get_cruds_user(
    session: AsyncSession = Depends(get_session),
) -> CrudsUser:
    return CrudsUser(session)


async def get_cruds_place(
    session: AsyncSession = Depends(get_session),
) -> CrudsPlace:
    return CrudsPlace(session)
