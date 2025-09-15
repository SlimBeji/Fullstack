import json
from http import HTTPStatus
from typing import cast

import pytest
from conftest import Helpers

from lib.utils import get_image_path
from models.crud import crud_place
from models.schemas import PlaceFindQuery, PlaceReadSchema
from types_ import Filter


async def _get_place_id() -> str:
    query = PlaceFindQuery(filters=dict(title=[Filter(op="eq", val="Stamford Bridge")]))
    result = await crud_place.fetch(query)
    data = result.data
    place = cast(PlaceReadSchema, data[0])
    return str(place.id)


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
    payload = dict(title=["Stamford Bridge"], fields=["location.lng", "location.lat"])
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
        location=json.dumps(dict(lat=1.0, lng=2.5)),
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
        location=json.dumps(dict(lat=1.0, lng=2.5)),
    )
    response = await helpers.client.post(
        "/api/places/", data=multipart_data, files=files, headers=headers
    )
    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.asyncio
async def test_get_place_by_id(helpers: Helpers):
    place_id = await _get_place_id()
    headers = dict(Authorization=helpers.user_token)
    response = await helpers.client.get(f"/api/places/{place_id}", headers=headers)
    assert response.status_code == HTTPStatus.OK
    data = response.json()
    assert data["address"] == "Fulham Road, London"
    assert data["title"] == "Stamford Bridge"
    assert data["description"] == "Chelsea FC Stadium"


@pytest.mark.asyncio
async def test_update_place(helpers: Helpers):
    place_id = await _get_place_id()
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
async def test_update_place_belonging_to_others(helpers: Helpers):
    place_id = await _get_place_id()
    payload = dict(description="Stamford Bridge - Stadium of the Blues")
    headers = dict(Authorization=helpers.user_token)
    response = await helpers.client.put(
        f"/api/places/{place_id}", json=payload, headers=headers
    )
    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.asyncio
async def test_delete_place_belonging_to_others(helpers: Helpers):
    headers = dict(Authorization=helpers.user_token)
    place_id = await _get_place_id()
    response = await helpers.client.delete(f"/api/places/{place_id}", headers=headers)
    assert response.status_code == HTTPStatus.UNAUTHORIZED


@pytest.mark.asyncio
async def test_delete_place(helpers: Helpers):
    headers = dict(Authorization=helpers.admin_token)
    place_id = await _get_place_id()
    response = await helpers.client.delete(f"/api/places/{place_id}", headers=headers)
    assert response.status_code == HTTPStatus.OK
    assert response.json()["message"] == f"Deleted place {place_id}"
