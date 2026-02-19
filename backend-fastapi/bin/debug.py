import asyncio

from models.crud import crud_place
from services.setup import close_all, start_all


async def debug():
    place = await crud_place.get("689caa667815c102e5d7f0df")
    if place:
        print(place.model_dump())


async def main():
    await start_all()
    await debug()
    await close_all()


if __name__ == "__main__":
    asyncio.run(main())
