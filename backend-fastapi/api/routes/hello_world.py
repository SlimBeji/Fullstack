from fastapi import APIRouter

hello_world_router = APIRouter(prefix="/api/hello-world", tags=["Hello World"])


@hello_world_router.get("/", summary="Hello World Endpoint")
async def hello():
    return dict(message="Hello World!")
