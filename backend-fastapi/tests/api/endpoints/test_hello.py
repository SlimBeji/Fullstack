from http import HTTPStatus

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_hello_world(client: AsyncClient):
    resp = await client.get("/api/hello-world")
    j = resp.json()
    assert resp.status_code == HTTPStatus.OK
    assert j == dict(message="Hello World!")
