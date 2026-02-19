import asyncio

from services.instances import pg_client


async def debug():
    tables = await pg_client.list_tables()
    print(tables)


async def main():
    await pg_client.connect()
    await debug()
    await pg_client.close()


if __name__ == "__main__":
    asyncio.run(main())
