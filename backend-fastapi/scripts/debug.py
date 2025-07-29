import asyncio
from typing import Any

from lib.clients import close_dbs, connect_dbs
from models.crud import crud_place


def echo(output: Any):
    print("--------------------------")
    print(output)
    print("--------------------------")


async def debug():
    place = await crud_place.get("6877d1a63d151f22a52c7943")
    if place:
        echo(place.model_dump())


async def main():
    await connect_dbs()
    await debug()
    await close_dbs()


if __name__ == "__main__":
    asyncio.run(main())
