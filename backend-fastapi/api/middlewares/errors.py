from fastapi import Request, Response
from fastapi.responses import JSONResponse

from lib.fastapi import ApiError
from types_ import CallNext


async def catch_exceptions(request: Request, call_next: CallNext) -> Response:
    try:
        return await call_next(request)
    except ApiError as e:
        data: dict = dict(error=True, message=e.message)
        if e.details:
            data["details"] = e.details
        return JSONResponse(data, e.code)
