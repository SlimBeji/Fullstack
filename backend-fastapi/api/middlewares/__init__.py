from api.middlewares.errors import catch_exceptions
from api.middlewares.json import limit_json_size
from types_ import HttpMiddleware

all_middlewares: list[HttpMiddleware] = [
    limit_json_size,
    catch_exceptions,
]
