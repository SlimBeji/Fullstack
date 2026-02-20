from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from services.instances import pg_client


async def get_session() -> AsyncGenerator[AsyncSession, None]:
    async with pg_client.session() as session:
        yield session
