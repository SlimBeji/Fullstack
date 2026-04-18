from http import HTTPStatus

from httpx import AsyncClient
import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from models.cruds import CrudsUser


@pytest.mark.asyncio
async def test_hello_world(client: AsyncClient):
    resp = await client.get("/api/hello-world")
    j = resp.json()
    assert resp.status_code == HTTPStatus.OK
    assert j == dict(message="Hello World!")


@pytest.mark.asyncio
async def test_hello_user(client: AsyncClient, db_session: AsyncSession):
    cruds = CrudsUser(db_session)
    token = await cruds.get_bearer("mslimbeji@gmail.com")
    headers = dict(Authorization=token)
    resp = await client.get("/api/hello-world/user", headers=headers)
    j = resp.json()
    assert resp.status_code == HTTPStatus.OK
    assert j == dict(message="Hello Slim Beji!")


@pytest.mark.asyncio
async def test_hello_admin(client: AsyncClient, db_session: AsyncSession):
    cruds = CrudsUser(db_session)
    token = await cruds.get_bearer("mslimbeji@gmail.com")
    headers = dict(Authorization=token)
    resp = await client.get("/api/hello-world/admin", headers=headers)
    j = resp.json()
    assert resp.status_code == HTTPStatus.OK
    assert j == dict(message="Hello Admin Slim Beji!")
