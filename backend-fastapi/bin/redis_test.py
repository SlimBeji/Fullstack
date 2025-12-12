import asyncio
from typing import Any

from services.instances import redis_client
from services.setup import close_all, start_all


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
    await start_all()
    await debug()
    await close_all()


if __name__ == "__main__":
    asyncio.run(main())
