import asyncio
import json
from typing import Any, Awaitable, Callable, Literal, ParamSpec, TypeVar

import redis.asyncio as async_redis
from pydantic import BaseModel
from testcontainers.redis import RedisContainer

from config import settings
from lib.utils.helpers import str_to_bool

P = ParamSpec("P")
R = TypeVar("R")
OutputFormat = Literal["json", "int", "float", "bool", ""] | type[BaseModel]


class RedisClient:
    def __init__(self) -> None:
        self.uri: str = settings.REDIS_URL
        self.default_expirartion: int = settings.REDIS_DEFAULT_EXPIRATION
        self._test_container: RedisContainer | None = None
        self._client: async_redis.Redis | None = None

    @property
    def is_test(self) -> bool:
        return settings.is_test

    @property
    def client(self) -> async_redis.Redis:
        if self._client is None:
            raise RuntimeError("Redis client is not connected. Call connect() first.")
        return self._client

    def _configure_container(self) -> None:
        if self._test_container is not None:
            return

        self._test_container = RedisContainer("redis:6.2-alpine")
        self._test_container.with_command(
            "redis-server", "--save ", "20", "1", "--loglevel ", "warning"
        )
        self._test_container.start()
        host = self._test_container.get_container_host_ip()
        port = self._test_container.get_exposed_port(6379)
        self.uri = f"redis://{host}:{port}/0"

    async def connect(self) -> None:
        # Configure the test container if in test mode
        if self.is_test:
            self._configure_container()

        # Connect to the database
        if self._client is None:
            self._client = async_redis.Redis.from_url(self.uri)
            await self._client.ping()

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

        if self._test_container:
            self._test_container.stop()
            self._test_container = None

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
