from typing import Annotated

from fastapi import APIRouter, Depends, Path, Query

from api.auth import get_current_admin, get_current_user
from models.crud import crud_user
from models.schemas import (
    UserMultipartPost,
    UserPutSchema,
    UserReadSchema,
    UserSearchGetSchema,
    UserSearchSchema,
    UsersPaginatedSchema,
)

user_router = APIRouter(prefix="/api/users", tags=["User"])

user_id_param = Path(
    ..., examples=["507f1f77bcf86cd799439011"], description="The ID of the user"
)


@user_router.get(
    "/", summary="Search and Filter users", response_model=UsersPaginatedSchema
)
async def get_users(query: Annotated[UserSearchGetSchema, Query()]):
    return await crud_user.fetch(query)


@user_router.post(
    "/query", summary="Search and Retrieve users", response_model=UsersPaginatedSchema
)
async def get_users_from_post(query: UserSearchSchema):
    return await crud_user.fetch(query)


@user_router.post("/", summary="User creation", response_model=UserReadSchema)
async def create_user(
    multipart_form: UserMultipartPost = Depends(),
    admin: UserReadSchema = Depends(get_current_admin),
):
    return await crud_user.safe_create(admin, multipart_form.to_post_schema())


@user_router.get(
    "/{user_id}",
    summary="Search and Retrieve user by id",
    response_model=UserReadSchema,
)
async def get_user(user_id: str = user_id_param):
    return await crud_user.get(user_id)


@user_router.put("/{user_id}", summary="Update users", response_model=UserReadSchema)
async def update_user(
    form: UserPutSchema,
    user_id: str = user_id_param,
    current_user: UserReadSchema = Depends(get_current_user),
):
    return await crud_user.safe_update_by_id(current_user, user_id, form)


@user_router.delete(
    "/{user_id}",
    summary="Delete user by id",
    responses={
        200: {
            "description": "Deletion confirmation message",
            "content": {
                "application/json": {
                    "example": {"message": "Deleted user 507f1f77bcf86cd799439011"}
                }
            },
        }
    },
)
async def delete_user(
    user: UserReadSchema = Depends(get_current_admin), user_id: str = user_id_param
):
    await crud_user.safe_delete(user, user_id)
    return dict(message=f"Deleted user {user_id}")
