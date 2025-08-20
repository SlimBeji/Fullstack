from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.middlewares import all_middlewares
from api.openapi import OPENAPI_METADATA
from api.routes import routers
from config import settings
from lib.sync import close_all, start_all
from types_ import HttpMiddleware


def register_routers(
    app: FastAPI, routers: list[APIRouter], include_in_schema: bool = True
):
    for router in routers:
        app.include_router(router, include_in_schema=include_in_schema)


def register_static_folder(
    app: FastAPI,
    static_files: StaticFiles,
    name: str = "static",
    endpoint: str = "/static",
):
    app.mount(endpoint, static_files, name)


def add_cors(app: FastAPI):
    origins = ["*"]
    methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    headers = [
        "Origin",
        "X-Requested-With",
        "Content-Type",
        "Accept",
        "Authorization",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=methods,
        allow_headers=headers,
    )


def register_middlewares(app: FastAPI, middlewares: list[HttpMiddleware]):
    # Register the cors middleware first
    add_cors(app)

    # Register the middlewares define in api/middlewares
    for middleware in middlewares:
        app.middleware("http")(middleware)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await start_all()
    yield
    await close_all()


def create_app(test: bool = False) -> FastAPI:
    if test:
        lifespan_param = None
    else:
        lifespan_param = lifespan

    app = FastAPI(
        title="My FastAPI Pydantic API",
        description="API documentation for my FastAPI application",
        version="1.0.0",
        openapi_tags=OPENAPI_METADATA,
        lifespan=lifespan_param,
    )

    if settings.is_production:
        pass

    register_middlewares(app, all_middlewares)
    register_routers(app, routers)

    return app
