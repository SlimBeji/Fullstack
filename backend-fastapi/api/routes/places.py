from typing import Annotated, cast

from fastapi import APIRouter, Depends, Path, Query

from api.middlewares import get_current_user
from models.cruds import CrudsPlace, PlaceOptions
from models.schemas import (
    PlaceMultipartPost,
    PlacePutSchema,
    PlaceReadSchema,
    PlaceSearchSchema,
    PlaceSelectableFields,
    PlacesPaginatedSchema,
    UserReadSchema,
)

from ..middlewares import get_cruds_place

place_router = APIRouter(prefix="/api/places", tags=["Place"])

place_id_param = Path(
    ...,
    examples=["507f1f77bcf86cd799439011"],
    description="The ID of the place",
)


@place_router.get(
    "/",
    summary="Search and Filter places",
    response_model=PlacesPaginatedSchema,
)
async def get_places(
    query: Annotated[PlaceSearchSchema, Query()],
    cruds: CrudsPlace = Depends(get_cruds_place),
    _: UserReadSchema = Depends(get_current_user),
):
    options = PlaceOptions(process=True, fields=None)
    return await cruds.paginate(query.to_search(), options)


@place_router.post(
    "/search",
    summary="Search and Retrieve places",
    response_model=PlacesPaginatedSchema,
)
async def get_places_from_post(
    query: PlaceSearchSchema,
    cruds: CrudsPlace = Depends(get_cruds_place),
    _: UserReadSchema = Depends(get_current_user),
):
    return await cruds.paginate(query.to_search())


@place_router.post(
    "/", summary="Place creation", response_model=PlaceReadSchema
)
async def create_place(
    multipart_form: PlaceMultipartPost = Depends(),
    cruds: CrudsPlace = Depends(get_cruds_place),
    user: UserReadSchema = Depends(get_current_user),
):
    options = PlaceOptions(fields=None, process=True)
    return await cruds.user_post(user, multipart_form.to_post_schema(), options)


@place_router.get(
    "/{place_id}",
    summary="Search and Retrieve place by id",
    response_model=PlaceReadSchema | dict,
)
async def get_place(
    fields: Annotated[
        list[PlaceSelectableFields] | None,
        Query(
            description="Fields to include in the response; omit for full document",
            examples=[["id"]],
        ),
    ] = None,
    place_id: str = place_id_param,
    cruds: CrudsPlace = Depends(get_cruds_place),
    _: UserReadSchema = Depends(get_current_user),
):
    options = PlaceOptions(fields=fields, process=True)
    return await cruds.get_partial(place_id, options)


@place_router.put(
    "/{place_id}", summary="Update places", response_model=PlaceReadSchema
)
async def update_place(
    form: PlacePutSchema,
    place_id: str = place_id_param,
    cruds: CrudsPlace = Depends(get_cruds_place),
    current_user: UserReadSchema = Depends(get_current_user),
):
    options = PlaceOptions(fields=None, process=True)
    return await cruds.user_put(current_user, place_id, form, options)


@place_router.delete(
    "/{place_id}",
    summary="Delete place by id",
    responses={
        200: {
            "description": "Deletion confirmation message",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Deleted place 507f1f77bcf86cd799439011"
                    }
                }
            },
        }
    },
)
async def delete_place(
    user: UserReadSchema = Depends(get_current_user),
    place_id: str = place_id_param,
    cruds: CrudsPlace = Depends(get_cruds_place),
):
    await cruds.user_delete(user, place_id)
    return dict(message=f"Deleted place {place_id}")
