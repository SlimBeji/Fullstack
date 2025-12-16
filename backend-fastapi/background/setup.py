from typing import TypedDict

from bson import ObjectId

from lib.utils import StrEnum

# Queues


class Queues(StrEnum):
    EMAILS = "emails"
    AI = "ai"


# Tasks & Payload

TASK_PLACE_EMBEDDING = "place_embedding"


class PlaceEmbbeddingData(TypedDict):
    place_id: str | ObjectId


TASK_NEWSLETTER = "newsletter"


class NewsletterData(TypedDict):
    name: str
    email: str
