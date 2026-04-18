from httpx import AsyncClient
import pytest

from static import get_image_path


@pytest.mark.asyncio
async def test_signup(client: AsyncClient):
    with open(get_image_path("avatar1.jpg"), "rb") as image:
        files = dict(image=image.read())

    data = dict(
        name="Didier Drogba",
        email="new_user@gmail.com",
        password="very_secret",
    )

    resp = await client.post("/api/auth/signup", data=data, files=files)
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "new_user@gmail.com"
    assert "user_id" in body
    assert "access_token" in body


@pytest.mark.asyncio
async def test_signin(client: AsyncClient):
    payload = dict(username="mslimbeji@gmail.com", password="very_secret")

    resp = await client.post(
        "/api/auth/signin",
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["email"] == "mslimbeji@gmail.com"
    assert "user_id" in body
    assert "access_token" in body
