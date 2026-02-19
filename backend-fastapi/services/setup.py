import asyncio

from background.publishers import publisher
from models.examples import dump_db, seed_db
from services.instances import pg_client, redis_client


async def connect_dbs() -> None:
    # when updating this, dont forget to update connect_dbs
    # in tasks/broker.py. This method was duplicated there
    # to avoid circular imports or complicated code reorganization
    await asyncio.gather(pg_client.connect(), redis_client.connect())


async def close_dbs() -> None:
    await asyncio.gather(pg_client.close(), redis_client.close())


async def start_all() -> None:
    await connect_dbs()
    publisher.start()


async def close_all() -> None:
    await close_dbs()
    publisher.close()


async def seed_test_data() -> None:
    await connect_dbs()
    await dump_db()
    await seed_db()
    await close_dbs()
