import os

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from api.app import create_app
from config import settings
from lib.sync import close_all, start_all


@pytest.fixture(autouse=True)
def set_env_test():
    os.environ["ENV"] = "test"
    settings.ENV = "test"


@pytest_asyncio.fixture(scope="module")
async def client():
    app = create_app()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await start_all()
        yield ac
        await close_all()
