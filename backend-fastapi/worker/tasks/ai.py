import logging
from typing import TypedDict

from bson import ObjectId

from config import settings
from lib.clients import hugging_face
from models.crud import crud_place
from types_ import Queues, Tasks
from worker.tasks.base import dramatiq_task


class PlaceEmbbeddingData(TypedDict):
    place_id: str | ObjectId


@dramatiq_task(Tasks.PLACE_EMBEDDING, Queues.AI)
async def place_embedding_task(data: PlaceEmbbeddingData):
    place_id = data["place_id"]
    place = await crud_place.get_document(place_id)
    if place is None:
        logging.warning(f"No place with id {place_id} found in the database")
        return

    text = f"{place.title} - {place.description}"
    result = await hugging_face.embed_text(text)
    place.embedding = result
    await crud_place.save_document(place)
    logging.info(result)


def place_embeddding(place_id: str | ObjectId) -> None:
    if settings.is_test:
        return
    place_embedding_task.send(PlaceEmbbeddingData(place_id=place_id))
