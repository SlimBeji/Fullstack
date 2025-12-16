from beanie import PydanticObjectId
from bson import ObjectId
from dramatiq import Message

from background.publishers.publisher import publisher
from background.setup import TASK_PLACE_EMBEDDING, PlaceEmbbeddingData, Queues
from config import settings


def place_embedding(
    place_id: str | ObjectId | PydanticObjectId | None,
):
    if settings.is_test or place_id is None:
        return

    payload = PlaceEmbbeddingData(place_id=place_id)
    message = Message[None](
        Queues.AI.value,
        actor_name=TASK_PLACE_EMBEDDING,
        args=(payload,),
        kwargs={},
        options={},
    )
    publisher.send(message)
