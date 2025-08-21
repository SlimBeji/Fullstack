import os

os.environ["ENV"] = "test"


import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from api.app import create_app
from config import settings
from lib.sync import close_all, seed_test_data, start_all


@pytest.fixture(autouse=True)
def set_env_test():
    os.environ["ENV"] = "test"
    settings.ENV = "test"


@pytest_asyncio.fixture(scope="module")
async def seeded_db():
    await seed_test_data()
    yield


@pytest_asyncio.fixture
async def client(seeded_db):
    app = create_app(test=True)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await start_all()
        yield ac
        await close_all()
