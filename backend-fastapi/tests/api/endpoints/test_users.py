from http import HTTPStatus

import pytest
from conftest import Helpers

from lib.utils import get_image_path


@pytest.mark.asyncio
async def test_fetch_users(helpers: Helpers):
    headers = dict(Authorization=helpers.user_token)
    response = await helpers.client.get("/api/users/", headers=headers)
    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert "page" in data and data["page"] == 1
    assert "totalPages" in data
    assert "totalCount" in data
    assert "data" in data


@pytest.mark.asyncio
async def test_query_users(helpers: Helpers):
    headers = dict(Authorization=helpers.user_token)
    payload = dict(email=["regex:@gmail.com"], fields=["email", "name"])
    response = await helpers.client.post(
        "/api/users/query", json=payload, headers=headers
    )
    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert data["page"] == 1
    assert "totalPages" in data
    assert data["totalCount"] == 1
    fetched = data["data"][0]
    assert fetched == {"name": "Slim Beji", "email": "mslimbeji@gmail.com"}


@pytest.mark.asyncio
async def test_create_user_as_admin(helpers: Helpers):
    files = dict(image=open(get_image_path("avatar1.jpg"), "rb"))
    headers = dict(Authorization=helpers.admin_token)
    data = dict(
        name="Test Van Test",
        email="test@test.com",
        password="very_secret",
        isAdmin=True,
    )
    response = await helpers.client.post(
        "/api/users/", data=data, files=files, headers=headers
    )
    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert data["email"] == "test@test.com"
    assert data["name"] == "Test Van Test"
    assert data["isAdmin"] is True


@pytest.mark.asyncio
async def test_create_user_as_non_admin(helpers: Helpers):
    files = dict(image=open(get_image_path("avatar2.jpg"), "rb"))
    headers = dict(Authorization=helpers.user_token)
    data = dict(
        name="Test Van Test II",
        email="test_2@test.com",
        password="very_secret",
        isAdmin=True,
    )
    response = await helpers.client.post(
        "/api/users/", data=data, files=files, headers=headers
    )
    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.asyncio
async def test_get_user_by_id(helpers: Helpers):
    headers = dict(Authorization=helpers.user_token)
    response = await helpers.client.get(
        f"/api/users/{helpers.user.id}", headers=headers
    )
    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert data["email"] == "beji.slim@yahoo.fr"
    assert data["name"] == "Mohamed Slim Beji"


@pytest.mark.asyncio
async def test_update_user(helpers: Helpers):
    data = dict(name="Slim El Beji")
    headers = dict(Authorization=helpers.user_token)
    response = await helpers.client.put(
        f"/api/users/{helpers.user.id}", json=data, headers=headers
    )
    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert data["email"] == "beji.slim@yahoo.fr"
    assert data["name"] == "Slim El Beji"


@pytest.mark.asyncio
async def test_users_cannot_update_others(helpers: Helpers):
    data = dict(name="Slim El Beji")
    headers = dict(Authorization=helpers.user_token)
    response = await helpers.client.put(
        f"/api/users/{helpers.admin.id}", json=data, headers=headers
    )
    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.asyncio
async def test_delete_user_as_non_admin(helpers: Helpers):
    headers = dict(Authorization=helpers.user_token)
    response = await helpers.client.delete(
        f"/api/users/{helpers.user.id}", headers=headers
    )
    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.asyncio
async def test_delete_user_as_admin(helpers: Helpers):
    headers = dict(Authorization=helpers.admin_token)
    response = await helpers.client.delete(
        f"/api/users/{helpers.user.id}", headers=headers
    )
    assert response.status_code == HTTPStatus.OK
    assert response.json()["message"] == f"Deleted user {helpers.user.id}"
