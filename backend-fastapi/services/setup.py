import asyncio

from background.crons import close_crons
from models.examples import dump_db, seed_db
from services.instances import db, redis_client


async def connect_dbs() -> None:
    # when updating this, dont forget to update connect_dbs
    # in tasks/broker.py. This method was duplicated there
    # to avoid circular imports or complicated code reorganization
    await asyncio.gather(db.connect(), redis_client.connect())


async def close_dbs() -> None:
    await asyncio.gather(db.close(), redis_client.close())


async def start_all() -> None:
    await connect_dbs()


async def close_all() -> None:
    await close_dbs()
    close_crons()


async def seed_test_data() -> None:
    await connect_dbs()
    await dump_db()
    await seed_db()
    await close_dbs()
