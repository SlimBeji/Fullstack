import logging
from typing import TypedDict

from beanie import PydanticObjectId
from bson import ObjectId

from background.setup import Queues, Tasks
from background.tasks.broker import dramatiq_task
from config import settings
from services.instances import hf_client


class PlaceEmbbeddingData(TypedDict):
    place_id: str | ObjectId


@dramatiq_task(Tasks.PLACE_EMBEDDING, Queues.AI)
async def place_embedding_task(data: PlaceEmbbeddingData):
    # Lazy loading to avoid circular import issues
    from models.crud import crud_place

    place_id = data["place_id"]
    place = await crud_place.get_document(place_id)
    if place is None:
        logging.warning(f"No place with id {place_id} found in the database")
        return

    text = f"{place.title} - {place.description}"
    result = await hf_client.embed_text(text)
    place.embedding = result
    await crud_place.save_document(place)
    logging.info(result)


def place_embeddding(
    place_id: str | ObjectId | PydanticObjectId | None,
) -> None:
    if settings.is_test or place_id is None:
        return
    place_embedding_task.send(PlaceEmbbeddingData(place_id=str(place_id)))
