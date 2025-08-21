import asyncio
import json
from typing import Any, Awaitable, Callable, Literal, ParamSpec, TypeVar

import redis.asyncio as async_redis
from pydantic import BaseModel

from config import settings
from lib.utils.helpers import str_to_bool

P = ParamSpec("P")
R = TypeVar("R")
OutputFormat = Literal["json", "int", "float", "bool", ""] | type[BaseModel]


class RedisClient:
    def __init__(self) -> None:
        self.default_expirartion: int = settings.REDIS_DEFAULT_EXPIRATION
        self._client: async_redis.Redis | None = None
        self.uri: str = settings.REDIS_URL
        if self.is_test:
            self.uri = settings.REDIS_TEST_URL

    @property
    def is_test(self) -> bool:
        return settings.is_test

    @property
    def client(self) -> async_redis.Redis:
        if self._client is None:
            raise RuntimeError("Redis client is not connected. Call connect() first.")
        return self._client

    async def connect(self) -> None:
        # Connect to the database
        if self._client is None:
            self._client = async_redis.Redis.from_url(self.uri)
            await self._client.ping()

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    async def flushall(self) -> None:
        await self.client.flushall()

    async def get(self, key: str, format: OutputFormat = "") -> Any:
        raw: bytes = await self.client.get(key)
        if raw is None:
            return None

        stored = raw.decode()
        if isinstance(format, type) and issubclass(format, BaseModel):
            try:
                return format(**json.loads(stored))
            except:
                # Value become not valid, purge it and return None
                await self.delete(key)
                return None

        elif format == "json":
            return json.loads(stored)
        elif format == "int":
            return int(stored)
        elif format == "float":
            return float(stored)
        elif format == "bool":
            return str_to_bool(str(stored))
        return stored

    async def set(self, key: str, val: Any, expiration: int | None = None) -> None:
        expiration = expiration or self.default_expirartion
        if isinstance(val, dict) or isinstance(val, list):
            val = json.dumps(val)
        elif isinstance(val, BaseModel):
            val = json.dumps(val.model_dump(fallback=str))
        return await self.client.set(key, val, ex=expiration)

    async def delete(self, key: str) -> None:
        return await self.client.delete(key)

    def wrap(
        self,
        keygen: Callable[P, str],
        format: OutputFormat = "",
        expiration: int | None = None,
    ):
        expiration = expiration or self.default_expirartion

        def decorator(fn: Callable[P, R]) -> Callable[P, Awaitable[R]]:
            async def wrapper(*args, **kwargs) -> R:
                key = keygen(*args, **kwargs)
                stored_raw = await self.get(key, format=format)
                if stored_raw is not None:
                    return stored_raw

                if asyncio.iscoroutinefunction(fn):
                    result = await fn(*args, **kwargs)
                else:
                    result = fn(*args, **kwargs)

                await self.set(key, result, expiration)
                return result

            return wrapper

        return decorator


redis_client = RedisClient()
