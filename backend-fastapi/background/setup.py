from typing import TypedDict

from bson import ObjectId

from config import settings
from lib.utils import StrEnum

# Broker setup

REDIS_URL = settings.REDIS_URL
MAX_AGE = 7 * 24 * 60 * 60 * 1000

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
