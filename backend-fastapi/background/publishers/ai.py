from dramatiq import Message

from background.bgconfig import (
    TASK_PLACE_EMBEDDING,
    PlaceEmbbeddingData,
    Queues,
)
from background.publishers.publisher import publisher
from config import settings


def place_embedding(
    place_id: int,
):
    if settings.is_test or place_id is None:
        return

    payload = PlaceEmbbeddingData(place_id=place_id)
    message = Message[None](
        str(Queues.AI),
        actor_name=TASK_PLACE_EMBEDDING,
        args=(payload,),
        kwargs={},
        options={},
    )
    publisher.send(message)
