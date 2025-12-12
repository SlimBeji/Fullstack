from fastapi import Request, Response
from fastapi.responses import JSONResponse

from ..errors import ApiError
from ..types import CallNext


async def catch_exceptions(request: Request, call_next: CallNext) -> Response:
    try:
        return await call_next(request)
    except ApiError as e:
        data: dict = dict(error=True, message=e.message)
        if e.details:
            data["details"] = e.details
        return JSONResponse(data, e.code)
