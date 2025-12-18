from http import HTTPStatus

from fastapi import Request
from fastapi.responses import JSONResponse

from .types import CallNext, HttpMiddleware


class RequestTooLarge(Exception):
    pass


def limit_json_size(max_size: int) -> HttpMiddleware:
    async def limit_json_size_middleware(request: Request, call_next: CallNext):
        if request.method in ("POST", "PUT", "PATCH"):
            content_type = request.headers.get("content-type", "")
            if content_type.startswith("application/json"):
                received = 0
                original_receive = request._receive

                async def limited_receive():
                    nonlocal received
                    message = await original_receive()
                    received += len(message.get("body", b""))
                    if received > max_size:
                        raise RequestTooLarge
                    return message

                request._receive = limited_receive

        try:
            return await call_next(request)
        except RequestTooLarge:
            return JSONResponse(
                {"detail": "Request body too large"},
                status_code=HTTPStatus.REQUEST_ENTITY_TOO_LARGE,
            )

    return limit_json_size_middleware
