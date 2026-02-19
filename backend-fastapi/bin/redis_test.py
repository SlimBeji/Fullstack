import asyncio

from services.instances import redis_client


async def debug():
    await redis_client.set("secret_number", 158)
    print(await redis_client.get("secret_number", "int"))
    await redis_client.delete("secret_number")
    print(await redis_client.get("secret_number", "int"))


async def main():
    await redis_client.connect()
    await debug()
    await redis_client.close()


if __name__ == "__main__":
    asyncio.run(main())
