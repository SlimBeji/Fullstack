from typing import AsyncGenerator, cast

from beanie import init_beanie
from motor.motor_asyncio import (
    AsyncIOMotorClient,
    AsyncIOMotorClientSession,
    AsyncIOMotorDatabase,
)
from pymongo.asynchronous.database import AsyncDatabase
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
        self.client: AsyncIOMotorClient | None = None
        self.db: AsyncIOMotorDatabase | None = None

    @property
    def is_test(self) -> bool:
        return settings.is_test

    async def _configure_container(self) -> None:
        if self._test_container is not None:
            return

        self._test_container = MongoDbContainer("mongo:latest")
        self._test_container.with_command("mongod", "--replSet", "rs0", "--bind_ip_all")
        self._test_container.start()
        self.uri = self._test_container.get_connection_url()

    async def _seed_test_data(self) -> None:
        if self.db is None:
            raise RuntimeError("Cannot seed while the connection is not established")

        collections = await self.db.list_collection_names()
        was_seeded = Collections.USERS.value in collections
        if not was_seeded:
            await seed_db()

    async def connect(self) -> None:
        # Configure the test container if in test mode
        if self.is_test:
            await self._configure_container()

        # Connect to the database
        self.client = AsyncIOMotorClient(self.uri)
        self.db = self.client[self.db_name]
        await init_beanie(cast(AsyncDatabase, self.db), document_models=document_models)

        # Seed data for testing
        if self.is_test:
            await self._seed_test_data()

    def close(self) -> None:
        if self.client:
            self.client.close()
            self.client = None
            self.db = None

        if self._test_container:
            self._test_container.stop()
            self._test_container = None

    async def session_transaction(
        self,
    ) -> AsyncGenerator[AsyncIOMotorClientSession, None]:
        if self.client is None:
            raise RuntimeError("MongoDB client not connected. Call db.connect() first.")

        session: AsyncIOMotorClientSession | None = None
        try:
            session = await self.client.start_session()
            async with session.start_transaction():
                yield session
        finally:
            if session:
                session.end_session()


db = MongoClient()
