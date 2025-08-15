from typing import Awaitable, Callable

from fastapi import Request, Response

type CallNext = Callable[[Request], Awaitable[Response]]

type Middleware = Callable[[Request, CallNext], Awaitable[Response]]
