from http import HTTPStatus

from .types import CallNext


class ApiError(Exception):
    def __init__(
        self, code: HTTPStatus, message: str = "", details: dict | None = None
    ) -> None:
        self.code = code
        self.message = message or "An unknown error occured"
        self.details = details or {}


from fastapi import Request, Response
from fastapi.responses import JSONResponse


async def catch_exceptions(request: Request, call_next: CallNext) -> Response:
    try:
        return await call_next(request)
    except ApiError as e:
        data: dict = dict(error=True, message=e.message)
        if e.details:
            data["details"] = e.details
        return JSONResponse(data, e.code)
