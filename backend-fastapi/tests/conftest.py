import os

os.environ["ENV"] = "test"


import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from api.app import create_app
from config import settings
from lib.encryption import create_token
from lib.sync import close_all, seed_test_data, start_all
from models.crud import crud_user
from models.schemas import UserReadSchema


class Helpers:
    def __init__(
        self,
        client: AsyncClient,
        admin: UserReadSchema,
        admin_token: str,
        user: UserReadSchema,
        user_token: str,
    ) -> None:
        self.client = client
        self.admin = admin
        self.admin_token = admin_token
        self.user = user
        self.user_token = user_token


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


@pytest_asyncio.fixture
async def helpers(seeded_db):
    app = create_app(test=True)
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await start_all()
        admin = await crud_user.get_by_email("mslimbeji@gmail.com")
        admin_token = f"Bearer {create_token(admin).access_token}"
        user = await crud_user.get_by_email("beji.slim@yahoo.fr")
        user_token = f"Bearer {create_token(user).access_token}"
        yield Helpers(ac, admin, admin_token, user, user_token)
        await close_all()
