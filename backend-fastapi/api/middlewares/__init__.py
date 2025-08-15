from api.middlewares.errors import *
from types_ import Middleware

all_middlewares: list[Middleware] = [catch_exceptions]
