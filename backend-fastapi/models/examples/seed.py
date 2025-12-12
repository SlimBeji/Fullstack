import asyncio

from beanie.odm.fields import PydanticObjectId

from lib.clients import cloud_storage, db
from models.collections import CollectionEnum, document_models
from models.crud import crud_place, crud_user
from models.examples.places import PLACES
from models.examples.users import USERS
from models.schemas import (
    PlaceCreateSchema,
    PlaceSeedSchema,
    UserCreateSchema,
    UserSeedSchema,
)
from services import redis_client

USER_REF_MAPPING: dict[int, str] = {}
PLACE_REF_MAPPING: dict[int, str] = {}


async def create_collections() -> None:
    coroutines = []
    for name in CollectionEnum.values():
        coroutines.append(db.create_collection(name))
    await asyncio.gather(*coroutines)


async def _seed_user(user: UserSeedSchema) -> None:
    if user.imageUrl:
        imageUrl = cloud_storage.upload_file(user.imageUrl)
    else:
        imageUrl = ""

    data = user.model_dump()
    data["imageUrl"] = imageUrl
    document = await crud_user.create_document(UserCreateSchema(**data))
    USER_REF_MAPPING[user.ref] = str(document.id)


async def seed_users(users: list[UserSeedSchema]) -> None:
    couroutines = [_seed_user(u) for u in users]
    await asyncio.gather(*couroutines)


async def _seed_place(place: PlaceSeedSchema) -> None:
    if place.imageUrl:
        imageUrl = cloud_storage.upload_file(place.imageUrl)
    else:
        imageUrl = ""

    creatorId = PydanticObjectId(USER_REF_MAPPING[place.creator_ref])
    data = place.model_dump()
    data["imageUrl"] = imageUrl
    data["creatorId"] = creatorId
    document = await crud_place.create_document(PlaceCreateSchema(**data))
    PLACE_REF_MAPPING[place.ref] = str(document.id)


async def seed_places(places: list[PlaceSeedSchema]) -> None:
    couroutines = [_seed_place(p) for p in places]
    await asyncio.gather(*couroutines)


async def seed_db(verbose: bool = False) -> None:
    await create_collections()
    await seed_users(USERS)
    if verbose:
        print("✅ Collection User seeded!")
    await seed_places(PLACES)
    if verbose:
        print("✅ Collection Place seeded!")
    if verbose:
        print("✅ Finished. You may exit")


async def dump_db(verbose: bool = False) -> None:
    for document in document_models:
        await document.delete_all()
        if verbose:
            print(f"✅ Collection {document.__name__} cleared!")

    await redis_client.flushall()
    if verbose:
        print("✅ Cache DB flushed")
        print(("✅ Finished. You may exit"))
