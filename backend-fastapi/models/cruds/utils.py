"""
This module is used to avoid circular imports
with cruds classes importing each others
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..orm import User


async def user_exists(session: AsyncSession, id: int | str) -> bool:
    stmt = select(User.id).where(User.id == id)
    result = await session.execute(stmt)
    return result.scalar_one_or_none() is not None
