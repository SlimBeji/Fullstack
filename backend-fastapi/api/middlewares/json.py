from http import HTTPStatus

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.types import ASGIApp, Receive, Scope, Send

from config import settings
from types_ import AsgiMiddleware


class LimitJSONSizeMiddleware(AsgiMiddleware):
    def __init__(self, app: ASGIApp, max_size: int = settings.JSON_MAX_SIZE):
        self.app = app
        self.max_size = max_size

    async def __call__(self, scope: Scope, receive: Receive, send: Send):
        if scope["type"] == "http":
            request = Request(scope, receive=receive)
            if request.method in ("POST", "PUT", "PATCH"):
                content_type = request.headers.get("content-type", "")
                if content_type.startswith("application/json"):
                    body = await request.body()
                    if len(body) > self.max_size * 1024:
                        response = JSONResponse(
                            {"detail": "Request body too large"},
                            status_code=HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
                        )
                        await response(scope, receive, send)
                        return

        await self.app(scope, receive, send)
