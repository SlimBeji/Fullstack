import asyncio
from typing import Any

from models.crud import crud_place
from services import close_all, start_all


def echo(output: Any):
    print("--------------------------")
    print(output)
    print("--------------------------")


async def debug():
    place = await crud_place.get("689caa667815c102e5d7f0df")
    if place:
        echo(place.model_dump())


async def main():
    await start_all()
    await debug()
    await close_all()


if __name__ == "__main__":
    asyncio.run(main())
