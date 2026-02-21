from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query

from api.middlewares import get_current_admin, get_current_user
from models.cruds import CrudsUser
from models.schemas import (
    UserGetSchema,
    UserMultipartPost,
    UserPutSchema,
    UserReadSchema,
    UserSearchSchema,
    UsersPaginatedSchema,
)

from ..middlewares import get_cruds_user

user_router = APIRouter(prefix="/api/users", tags=["User"])

user_id_param = Path(
    ..., examples=["507f1f77bcf86cd799439011"], description="The ID of the user"
)


@user_router.get(
    "/", summary="Search and Filter users", response_model=UsersPaginatedSchema
)
async def get_users(
    query: Annotated[UserSearchSchema, Query()],
    cruds: CrudsUser = Depends(get_cruds_user),
    _: UserReadSchema = Depends(get_current_user),
):
    return await cruds.fetch(query)


@user_router.post(
    "/search",
    summary="Search and Retrieve users",
    response_model=UsersPaginatedSchema,
)
async def get_users_from_post(
    query: UserSearchSchema,
    cruds: CrudsUser = Depends(get_cruds_user),
    _: UserReadSchema = Depends(get_current_user),
):
    return await cruds.fetch(query)


@user_router.post("/", summary="User creation", response_model=UserReadSchema)
async def create_user(
    cruds: CrudsUser = Depends(get_cruds_user),
    multipart_form: UserMultipartPost = Depends(),
    admin: UserReadSchema = Depends(get_current_admin),
):
    return await cruds.user_create(admin, multipart_form.to_post_schema())


@user_router.get(
    "/{user_id}",
    summary="Search and Retrieve user by id",
    response_model=UserReadSchema,
)
async def get_user(
    params: Annotated[UserGetSchema, Query()],
    user_id: str = user_id_param,
    cruds: CrudsUser = Depends(get_cruds_user),
    _: UserReadSchema = Depends(get_current_user),
):
    return await cruds.get(user_id)


@user_router.put(
    "/{user_id}", summary="Update users", response_model=UserReadSchema
)
async def update_user(
    form: UserPutSchema,
    user_id: str = user_id_param,
    current_user: UserReadSchema = Depends(get_current_user),
    cruds: CrudsUser = Depends(get_cruds_user),
):
    return await cruds.user_update_by_id(current_user, user_id, form)


@user_router.delete(
    "/{user_id}",
    summary="Delete user by id",
    responses={
        200: {
            "description": "Deletion confirmation message",
            "content": {
                "application/json": {
                    "example": {
                        "message": "Deleted user 507f1f77bcf86cd799439011"
                    }
                }
            },
        }
    },
)
async def delete_user(
    user: UserReadSchema = Depends(get_current_admin),
    user_id: str = user_id_param,
    cruds: CrudsUser = Depends(get_cruds_user),
):
    await cruds.user_delete(user, user_id)
    return dict(message=f"Deleted user {user_id}")
