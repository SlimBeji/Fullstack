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
from testcontainers.mongodb import MongoDbContainer

from config import settings
from models.collections import document_models
from models.examples import seed_db
from types_ import Collections


class MongoClient:
    def __init__(self) -> None:
        self.db_name: str = settings.MONGO_DBNAME
        self.uri: str = settings.MONGO_URL
        self._test_container: MongoDbContainer | None = None
        self._client: AsyncIOMotorClient | None = None

        self.db: AsyncIOMotorDatabase | None = None

    @property
    def is_test(self) -> bool:
        return settings.is_test

    @property
    def client(self) -> AsyncIOMotorClient:
        if self._client is None:
            raise RuntimeError("Mongo client is not connected. Call connect() first.")
        return self._client

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
        return await self.db.drop_collection(name)

    def _configure_container(self) -> None:
        if self._test_container is not None:
            return

        self._test_container = MongoDbContainer("mongo:latest")
        self._test_container.with_command("mongod", "--replSet", "rs0", "--bind_ip_all")
        self._test_container.start()
        self.uri = self._test_container.get_connection_url()

    async def _seed_test_data(self) -> None:
        if self.db is None:
            raise RuntimeError("Cannot seed while the connection is not established")

        collections = await self.list_collections()
        was_seeded = Collections.USERS.value in collections
        if not was_seeded:
            await seed_db()

    async def connect(self) -> None:
        # Configure the test container if in test mode
        if self.is_test:
            self._configure_container()

        # Connect to the database
        self._client = AsyncIOMotorClient(self.uri)
        self.db = self._client[self.db_name]
        await init_beanie(cast(AsyncDatabase, self.db), document_models=document_models)

        # Seed data for testing
        if self.is_test:
            await self._seed_test_data()

    async def close(self) -> None:
        if self._client:
            self._client.close()
            self._client = None
            self.db = None

        if self._test_container:
            self._test_container.stop()
            self._test_container = None

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
