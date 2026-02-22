from background.publishers import publisher
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


async def seed_users(cruds: CrudsUser, users: list[UserSeedSchema]) -> None:
    for user in users:
        if user.imageUrl:
            imageUrl = cloud_storage.upload_file(user.imageUrl)
        else:
            imageUrl = ""

        data = user.model_dump()
        data["imageUrl"] = imageUrl
        id = await cruds.create(UserCreateSchema(**data))
        USER_REF_MAPPING[user.ref] = id


async def seed_places(cruds: CrudsPlace, places: list[PlaceSeedSchema]) -> None:
    for place in places:
        if place.imageUrl:
            imageUrl = cloud_storage.upload_file(place.imageUrl)
        else:
            imageUrl = ""

        creatorId = USER_REF_MAPPING[place.creator_ref]
        data = place.model_dump()
        data["imageUrl"] = imageUrl
        data["creatorId"] = creatorId
        embedding = data.pop("embedding")
        id = await cruds.seed(PlaceCreateSchema(**data), embedding)
        PLACE_REF_MAPPING[place.ref] = id


async def seed_db(verbose: bool = False) -> None:
    # Need to start the publisher because because cruds place
    # is calling it in the after_create hook
    publisher.start()

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
