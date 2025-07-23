from typing import Optional

from api.openapi import OPENAPI_METADATA
from api.routes import routers
from config import settings
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles


def register_routers(
    app: FastAPI, routers: list[APIRouter], include_in_schema: bool = True
):
    for router in routers:
        app.include_router(router, include_in_schema=include_in_schema)


def register_static_folder(
    app: FastAPI,
    static_files: StaticFiles,
    name: Optional[str] = "static",
    endpoint: Optional[str] = "/static",
):
    app.mount(endpoint, static_files, name)


def add_cors(app: FastAPI):
    origins = [settings.APP_URL]
    if "https" in settings.APP_URL:
        origins.append(settings.APP_URL.replace("https", "http"))

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    return app


def create_app() -> FastAPI:
    app = FastAPI(
        title="My FastAPI Pydantic API",
        description="API documentation for my FastAPI application",
        version="1.0.0",
        openapi_tags=OPENAPI_METADATA,
    )

    if settings.is_production:
        pass

    register_routers(app, routers)
    add_cors(app)

    return app
