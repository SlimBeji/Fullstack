from fastapi import APIRouter

from api.routes.auth import auth_router
from api.routes.hello_world import hello_world_router

routers: list[APIRouter] = []
routers.append(auth_router)
routers.append(hello_world_router)
