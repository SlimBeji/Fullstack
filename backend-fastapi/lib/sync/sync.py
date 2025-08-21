from lib.clients.utils import close_dbs, connect_dbs
from models.examples import dump_db, seed_db
from worker.crons import close_crons
from worker.tasks import close_workers


async def start_all() -> None:
    await connect_dbs()


async def close_all() -> None:
    await close_dbs()
    close_workers()
    close_crons()


async def seed_test_data() -> None:
    await connect_dbs()
    await dump_db()
    await seed_db()
    await close_dbs()
