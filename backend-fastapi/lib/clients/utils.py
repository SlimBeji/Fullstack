import asyncio

from lib.clients.cache import redis_client
from lib.clients.mongo import db


async def connect_dbs() -> None:
    await asyncio.gather(db.connect(), redis_client.connect())


async def close_dbs() -> None:
    await asyncio.gather(db.close(), redis_client.close())
