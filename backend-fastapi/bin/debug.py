import asyncio

from models.cruds import CrudsPlace
from services.instances import pg_client
from services.setup import close_all, start_all


async def debug():
    async with pg_client.session() as session:
        cruds = CrudsPlace(session)
        place = await cruds.get(1)

    if place:
        print(place.model_dump())


async def main():
    await start_all()
    await debug()
    await close_all()


if __name__ == "__main__":
    asyncio.run(main())
