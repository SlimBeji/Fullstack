from fastapi import APIRouter, Depends

from api.middlewares import get_current_admin, get_current_user
from background.publishers import send_newsletter
from models.schemas import UserReadSchema

hello_world_router = APIRouter(prefix="/api/hello-world", tags=["Hello World"])


@hello_world_router.get(
    "",
    summary="Hello World Endpoint",
    responses={
        200: {
            "content": {
                "application/json": {"example": {"message": "Hello World!"}}
            },
        }
    },
)
async def hello():
    send_newsletter("Slim", "mslimbeji@gmail.com")
    return dict(message="Hello World!")


@hello_world_router.get(
    "/user",
    summary="Hello World Endpoint for authenticated users",
    responses={
        200: {
            "content": {
                "application/json": {"example": {"message": "Hello Slim!"}}
            },
        }
    },
)
async def hello_user(user: UserReadSchema = Depends(get_current_user)):
    return dict(message=f"Hello {user.name}!")


@hello_world_router.get(
    "/admin",
    summary="Hello World Endpoint for admins only",
    responses={
        200: {
            "content": {
                "application/json": {
                    "example": {"message": "Hello Admin Slim!"}
                }
            },
        }
    },
)
async def hello_admin(user: UserReadSchema = Depends(get_current_admin)):
    return dict(message=f"Hello Admin {user.name}!")
