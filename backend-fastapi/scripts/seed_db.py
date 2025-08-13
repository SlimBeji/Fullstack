import asyncio

from lib.sync import close_all, start_all
from models.examples import seed_db


async def main() -> None:
    await start_all()
    await seed_db(True)
    await close_all()


if __name__ == "__main__":
    asyncio.run(main())
