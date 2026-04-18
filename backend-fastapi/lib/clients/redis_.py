import json
from typing import Any, Literal

from pydantic import BaseModel
import redis.asyncio as async_redis

from lib.utils.helpers import str_to_bool

OutputFormat = Literal["json", "int", "float", "bool", ""] | type[BaseModel]


class RedisClientConfig:
    def __init__(self, uri: str, expiration: int = 3600):
        self.uri = uri
        self.expiration = expiration


class RedisClient:
    def __init__(self, config: RedisClientConfig) -> None:
        self.uri: str = config.uri
        self.default_expirartion: int = config.expiration
        self._client: async_redis.Redis | None = None

    @property
    def client(self) -> async_redis.Redis:
        if self._client is None:
            raise RuntimeError(
                "Redis client is not connected. Call connect() first."
            )
        return self._client

    async def connect(self) -> None:
        # Connect to the redis database
        if self._client is None:
            self._client = async_redis.Redis.from_url(self.uri)
            await self._client.ping()  # type: ignore[misc]

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    async def flushall(self) -> None:
        await self.client.flushall()

    async def get(self, key: str, format_: OutputFormat = "") -> Any:
        raw: bytes = await self.client.get(key)
        if raw is None:
            return None

        stored = raw.decode()
        if isinstance(format_, type) and issubclass(format_, BaseModel):
            try:
                return format_.model_validate_json(stored)
            except Exception:
                # Value become not valid, purge it and return None
                await self.delete(key)
                return None

        elif format_ == "json":
            return json.loads(stored)
        elif format_ == "int":
            return int(stored)
        elif format_ == "float":
            return float(stored)
        elif format_ == "bool":
            return str_to_bool(str(stored))
        return stored

    async def set(
        self, key: str, val: Any, expiration: int | None = None
    ) -> None:
        expiration = expiration or self.default_expirartion
        if isinstance(val, (dict, list)):
            val = json.dumps(val)
        elif isinstance(val, BaseModel):
            val = val.model_dump_json()
        return await self.client.set(key, val, ex=expiration)

    async def delete(self, key: str) -> None:
        return await self.client.delete(key)
