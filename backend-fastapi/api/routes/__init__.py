from fastapi import APIRouter

from api.routes.auth import auth_router
from api.routes.hello_world import hello_world_router
from api.routes.places import place_router
from api.routes.users import user_router

routers: list[APIRouter] = []
routers.append(auth_router)
routers.append(hello_world_router)
routers.append(user_router)
routers.append(place_router)
