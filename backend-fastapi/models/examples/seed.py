import asyncio

from models.cruds import CrudsPlace, CrudsUser
from models.examples.places import PLACES
from models.examples.users import USERS
from models.orm import Tables
from models.schemas import (
    PlaceCreateSchema,
    PlaceSeedSchema,
    UserCreateSchema,
    UserSeedSchema,
)
from services.instances import cloud_storage, pg_client, redis_client

USER_REF_MAPPING: dict[int, int] = {}
PLACE_REF_MAPPING: dict[int, int] = {}


async def _seed_user(cruds: CrudsUser, user: UserSeedSchema) -> None:
    if user.imageUrl:
        imageUrl = cloud_storage.upload_file(user.imageUrl)
    else:
        imageUrl = ""

    data = user.model_dump()
    data["imageUrl"] = imageUrl
    id = await cruds.create(UserCreateSchema(**data))
    USER_REF_MAPPING[user.ref] = id


async def seed_users(cruds: CrudsUser, users: list[UserSeedSchema]) -> None:
    couroutines = [_seed_user(cruds, u) for u in users]
    await asyncio.gather(*couroutines)


async def _seed_place(cruds: CrudsPlace, place: PlaceSeedSchema) -> None:
    if place.imageUrl:
        imageUrl = cloud_storage.upload_file(place.imageUrl)
    else:
        imageUrl = ""

    creatorId = USER_REF_MAPPING[place.creator_ref]
    data = place.model_dump()
    data["imageUrl"] = imageUrl
    data["creatorId"] = creatorId
    embedding = data.pop("embedding")
    record = await cruds.seed(PlaceCreateSchema(**data), embedding)
    PLACE_REF_MAPPING[place.ref] = record.id


async def seed_places(crud: CrudsPlace, places: list[PlaceSeedSchema]) -> None:
    couroutines = [_seed_place(crud, p) for p in places]
    await asyncio.gather(*couroutines)


async def seed_db(verbose: bool = False) -> None:
    async with pg_client.session() as session:
        cruds_user = CrudsUser(session)
        cruds_place = CrudsPlace(session)
        await seed_users(cruds_user, USERS)
        if verbose:
            print("✅ Collection User seeded!")
        await seed_places(cruds_place, PLACES)
        if verbose:
            print("✅ Collection Place seeded!")
        if verbose:
            print("✅ Finished. You may exit")


async def dump_db(verbose: bool = False) -> None:
    for tablename in Tables.values():
        await pg_client.reset_table(tablename)
        if verbose:
            print(f"✅ Collection {tablename} cleared!")

    await redis_client.flushall()
    if verbose:
        print("✅ Cache DB flushed")
        print(("✅ Finished. You may exit"))
