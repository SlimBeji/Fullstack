import asyncio

from models.examples import dump_db
from services.instances import pg_client


async def main() -> None:
    await pg_client.connect()
    await dump_db(True)
    await pg_client.close()


if __name__ == "__main__":
    asyncio.run(main())
