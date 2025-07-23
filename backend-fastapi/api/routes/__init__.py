from fastapi import APIRouter

from api.routes.hello_world import hello_world_router

routers: list[APIRouter] = []
routers.append(hello_world_router)
