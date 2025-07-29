import asyncio
from typing import Any

from lib.clients import redis_client


def echo(output: Any):
    print("--------------------------")
    print(output)
    print("--------------------------")


async def debug():
    await redis_client.set("secret_number", 158)
    echo(await redis_client.get("secret_number", "int"))
    await redis_client.delete("secret_number")
    echo(await redis_client.get("secret_number", "int"))


async def main():
    await redis_client.connect()
    await debug()
    await redis_client.close()


if __name__ == "__main__":
    asyncio.run(main())
