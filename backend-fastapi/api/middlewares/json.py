from http import HTTPStatus

from fastapi import Request
from fastapi.responses import JSONResponse

from config import settings
from lib.fastapi import CallNext


class RequestTooLarge(Exception):
    pass


async def limit_json_size(request: Request, call_next: CallNext):
    if request.method in ("POST", "PUT", "PATCH"):
        content_type = request.headers.get("content-type", "")
        if content_type.startswith("application/json"):
            received = 0
            original_receive = request._receive

            async def limited_receive():
                nonlocal received
                message = await original_receive()
                received += len(message.get("body", b""))
                if received > settings.JSON_MAX_SIZE:
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
