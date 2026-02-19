import asyncio

from models.examples import seed_db
from services.setup import close_dbs, connect_dbs


async def main() -> None:
    await connect_dbs()
    await seed_db(True)
    await close_dbs()


if __name__ == "__main__":
    asyncio.run(main())
