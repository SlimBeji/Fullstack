from api.routes.hello_world import hello_world_router

from fastapi import APIRouter

routers: list[APIRouter] = []
routers.append(hello_world_router)
