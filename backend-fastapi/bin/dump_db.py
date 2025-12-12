import asyncio

from models.examples import dump_db
from services.setup import close_all, start_all


async def main() -> None:
    await start_all()
    await dump_db(True)
    await close_all()


if __name__ == "__main__":
    asyncio.run(main())
