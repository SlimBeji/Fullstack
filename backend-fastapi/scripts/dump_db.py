import asyncio

from lib.clients import close_dbs, connect_dbs
from models.examples import dump_db


async def main() -> None:
    await connect_dbs()
    await dump_db(True)
    await close_dbs()


if __name__ == "__main__":
    asyncio.run(main())
