from contextlib import asynccontextmanager
from typing import AsyncGenerator, cast

from beanie import init_beanie
from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorClientSession,
    AsyncIOMotorDatabase,
)
from pymongo.asynchronous.database import AsyncDatabase
from pymongo.errors import CollectionInvalid

from config import settings
from models.collections import document_models


class MongoClient:
    def __init__(self) -> None:
        self.uri: str = settings.MONGO_URL
        self._client: AsyncIOMotorClient | None = None
        self._db: AsyncIOMotorDatabase | None = None
        self.db_name: str = settings.MONGO_DBNAME
        if self.is_test:
            self.db_name = settings.MONGO_TEST_DBNAME

    @property
    def is_test(self) -> bool:
        return settings.is_test

    @property
    def client(self) -> AsyncIOMotorClient:
        if self._client is None:
            raise RuntimeError("Mongo client is not connected. Call connect() first.")
        return self._client

    @property
    def db(self) -> AsyncIOMotorDatabase:
        if self._db is None:
            raise RuntimeError("Mongo client is not connected. Call connect() first.")
        return self._db

    async def create_collection(self, name: str) -> None:
        try:
            await self.db.create_collection(name)
        except CollectionInvalid as e:
            if e._message == f"collection {name} already exists":
                return
            raise e

    async def list_collections(self) -> list[str]:
        return await self.db.list_collection_names()

    async def drop_collection(self, name: str) -> None:
        await self.db.drop_collection(name)

    async def init(self):
        if self._client:
            return

        self._client = AsyncIOMotorClient(self.uri)
        self._db = self._client[self.db_name]
        await init_beanie(
            cast(AsyncDatabase, self._db), document_models=document_models
        )

    async def connect(self) -> None:
        # Connect to the database
        await self.init()

    async def close(self) -> None:
        if self._client:
            self._client.close()
            self._client = None
            self._db = None

    @asynccontextmanager
    async def session_transaction(
        self,
    ) -> AsyncGenerator[AsyncIOMotorClientSession, None]:
        session: AsyncIOMotorClientSession | None = None
        try:
            session = await self.client.start_session()
            async with session.start_transaction():
                yield session
        finally:
            if session:
                await session.end_session()


db = MongoClient()
