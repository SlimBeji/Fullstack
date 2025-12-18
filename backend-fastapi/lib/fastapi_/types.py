from typing import Awaitable, Callable

from fastapi import Request, Response

type CallNext = Callable[[Request], Awaitable[Response]]

type HttpMiddleware = Callable[[Request, CallNext], Awaitable[Response]]
