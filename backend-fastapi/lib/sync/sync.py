from lib.clients.utils import close_dbs, connect_dbs
from worker.crons import close_crons
from worker.tasks import close_workers


async def start_all() -> None:
    await connect_dbs()


async def close_all() -> None:
    await close_dbs()
    close_workers()
    close_crons()
