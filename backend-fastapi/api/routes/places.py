from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query

from api.auth import get_current_user
from models.crud import crud_place
from models.schemas import (
    PlaceFiltersSchema,
    PlaceMultipartPost,
    PlacePutSchema,
    PlaceReadSchema,
    PlacesPaginatedSchema,
    UserReadSchema,
)

place_router = APIRouter(prefix="/api/places", tags=["Place"])

place_id_param = Path(
    ..., examples=["507f1f77bcf86cd799439011"], description="The ID of the place"
)


@place_router.get(
    "/", summary="Search and Filter places", response_model=PlacesPaginatedSchema
)
async def get_places(
    query: Annotated[PlaceFiltersSchema, Query()],
    user: UserReadSchema = Depends(get_current_user),
):
    return await crud_place.user_fetch(user, query)


@place_router.post(
    "/query", summary="Search and Retrieve places", response_model=PlacesPaginatedSchema
)
async def get_places_from_post(
    query: PlaceFiltersSchema,
    user: UserReadSchema = Depends(get_current_user),
):
    return await crud_place.user_fetch(user, query)


@place_router.post("/", summary="Place creation", response_model=PlaceReadSchema)
async def create_place(
    multipart_form: PlaceMultipartPost = Depends(),
    user: UserReadSchema = Depends(get_current_user),
):
    return await crud_place.user_create(user, multipart_form.to_post_schema())


@place_router.get(
    "/{place_id}",
    summary="Search and Retrieve place by id",
    response_model=PlaceReadSchema,
)
async def get_place(
    place_id: str = place_id_param,
    user: UserReadSchema = Depends(get_current_user),
):
    return await crud_place.user_get(user, place_id)


@place_router.put(
    "/{place_id}", summary="Update places", response_model=PlaceReadSchema
)
async def update_place(
    form: PlacePutSchema,
    place_id: str = place_id_param,
    current_user: UserReadSchema = Depends(get_current_user),
):
    return await crud_place.user_update_by_id(current_user, place_id, form)


@place_router.delete(
    "/{place_id}",
    summary="Delete place by id",
    responses={
        200: {
            "description": "Deletion confirmation message",
            "content": {
                "application/json": {
                    "example": {"message": "Deleted place 507f1f77bcf86cd799439011"}
                }
            },
        }
    },
)
async def delete_place(
    user: UserReadSchema = Depends(get_current_user), place_id: str = place_id_param
):
    await crud_place.user_delete(user, place_id)
    return dict(message=f"Deleted place {place_id}")
