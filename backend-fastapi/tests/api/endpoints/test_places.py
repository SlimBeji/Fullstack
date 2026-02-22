from http import HTTPStatus

import pytest
from conftest import Helpers
from sqlalchemy.ext.asyncio import AsyncSession

from models.cruds import CrudsPlace
from models.schemas import PlaceSearchQuery
from static import get_image_path


async def _get_place_id(db_session: AsyncSession) -> int:
    cruds = CrudsPlace(db_session)
    where = dict(title=cruds.eq("Stamford Bridge"))
    query = PlaceSearchQuery(size=100, where=where)  # type: ignore
    result = await cruds.search(query)
    return result[0].id


@pytest.mark.asyncio
async def test_get_places(helpers: Helpers):
    headers = dict(Authorization=helpers.user_token)
    response = await helpers.client.get(
        "/api/places/?title=eq:Stamford%20Bridge", headers=headers
    )
    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert data["page"] == 1
    assert "totalPages" in data
    assert data["totalCount"] == 1
    assert "data" in data


@pytest.mark.asyncio
async def test_query_places(helpers: Helpers):
    payload = dict(
        title=["Stamford Bridge"], fields=["location.lng", "location.lat"]
    )
    headers = dict(Authorization=helpers.user_token)
    response = await helpers.client.post(
        "/api/places/query",
        json=payload,
        headers=headers,
    )
    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert data["page"] == 1
    assert "totalPages" in data
    assert data["totalCount"] == 1
    assert "data" in data
    fetched = data["data"][0]
    assert fetched == dict(
        location=dict(lat=51.48180425016331, lng=-0.19090418688755467)
    )


@pytest.mark.asyncio
async def test_create_place(helpers: Helpers):
    files = dict(image=open(get_image_path("place1.jpg"), "rb"))
    headers = dict(Authorization=helpers.admin_token)

    multipart_data = dict(
        creatorId=str(helpers.admin.id),
        description="A brand new place",
        title="Brand New Place",
        address="Somewhere over the rainbow",
        lat=1.0,
        lng=2.5,
    )
    response = await helpers.client.post(
        "/api/places/",
        data=multipart_data,
        files=files,
        headers=headers,
    )

    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert data["creatorId"] == str(helpers.admin.id)
    assert data["description"] == "A brand new place"
    assert data["title"] == "Brand New Place"
    assert data["address"] == "Somewhere over the rainbow"


@pytest.mark.asyncio
async def test_create_place_belonging_to_others(helpers: Helpers):
    files = dict(image=open(get_image_path("place1.jpg"), "rb"))
    headers = dict(Authorization=helpers.user_token)
    multipart_data = dict(
        creatorId=str(helpers.admin.id),
        description="A brand new place",
        title="Brand New Place",
        address="Somewhere over the rainbow",
        lat=1.0,
        lng=2.5,
    )
    response = await helpers.client.post(
        "/api/places/", data=multipart_data, files=files, headers=headers
    )
    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.asyncio
async def test_get_place_by_id(helpers: Helpers, db_session: AsyncSession):
    place_id = await _get_place_id(db_session)
    headers = dict(Authorization=helpers.user_token)
    response = await helpers.client.get(
        f"/api/places/{place_id}", headers=headers
    )
    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert data["address"] == "Fulham Road, London"
    assert data["title"] == "Stamford Bridge"
    assert data["description"] == "Chelsea FC Stadium"


@pytest.mark.asyncio
async def test_update_place(helpers: Helpers, db_session: AsyncSession):
    place_id = await _get_place_id(db_session)
    payload = dict(description="Stamford Bridge - Home of the Blues")
    headers = dict(Authorization=helpers.admin_token)
    response = await helpers.client.put(
        f"/api/places/{place_id}", json=payload, headers=headers
    )
    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert data["address"] == "Fulham Road, London"
    assert data["title"] == "Stamford Bridge"
    assert data["description"] == "Stamford Bridge - Home of the Blues"


@pytest.mark.asyncio
async def test_update_place_belonging_to_others(
    helpers: Helpers, db_session: AsyncSession
):
    place_id = await _get_place_id(db_session)
    payload = dict(description="Stamford Bridge - Stadium of the Blues")
    headers = dict(Authorization=helpers.user_token)
    response = await helpers.client.put(
        f"/api/places/{place_id}", json=payload, headers=headers
    )
    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.asyncio
async def test_delete_place_belonging_to_others(
    helpers: Helpers, db_session: AsyncSession
):
    headers = dict(Authorization=helpers.user_token)
    place_id = await _get_place_id(db_session)
    response = await helpers.client.delete(
        f"/api/places/{place_id}", headers=headers
    )
    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.asyncio
async def test_delete_place(helpers: Helpers, db_session: AsyncSession):
    headers = dict(Authorization=helpers.admin_token)
    place_id = await _get_place_id(db_session)
    response = await helpers.client.delete(
        f"/api/places/{place_id}", headers=headers
    )
    assert response.status_code == HTTPStatus.OK
    assert response.json()["message"] == f"Deleted place {place_id}"
