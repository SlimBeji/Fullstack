from api.middlewares.errors import catch_exceptions
from api.middlewares.json import LimitJSONSizeMiddleware
from types_ import Middleware

all_middlewares: list[Middleware] = [
    LimitJSONSizeMiddleware,
    catch_exceptions,
]
