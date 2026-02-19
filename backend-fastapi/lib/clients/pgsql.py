from typing import List

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine


class PgClientConfig:
    def __init__(self, uri: str):
        self.uri = uri


class PgClient:
    def __init__(self, config: PgClientConfig):
        if not config.uri:
            raise ValueError("A valid uri must be provided to the pgsql client")

        self.uri = config.uri

        # use async driver
        if self.uri.startswith("postgresql://"):
            self.uri = self.uri.replace(
                "postgresql://", "postgresql+asyncpg://", 1
            )
        elif not self.uri.startswith("postgresql+asyncpg://"):
            raise ValueError(
                "URI must use postgresql:// or postgresql+asyncpg:// scheme"
            )

        self.client: AsyncEngine = create_async_engine(
            self.uri, echo=False, pool_pre_ping=True
        )

    async def connect(self) -> None:
        """Test the connection by executing a simple query"""
        async with self.client.connect() as conn:
            await conn.execute(text("SELECT 1"))

    async def close(self) -> None:
        await self.client.dispose()

    async def list_tables(self) -> List[str]:
        async with self.client.connect() as conn:
            result = await conn.execute(
                text(
                    "SELECT tablename FROM pg_tables WHERE schemaname = 'public'"
                )
            )
            tables = result.fetchall()
            return [row[0] for row in tables]

    async def reset_table(self, table: str) -> None:
        async with self.client.connect() as conn:
            await conn.execute(
                text(
                    f'TRUNCATE TABLE "public"."{table}" RESTART IDENTITY CASCADE'
                )
            )
            await conn.commit()
