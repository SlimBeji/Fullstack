from typing import TypedDict

TASK_PLACE_EMBEDDING = "place_embedding"


class PlaceEmbbeddingData(TypedDict):
    place_id: int


TASK_NEWSLETTER = "newsletter"


class NewsletterData(TypedDict):
    name: str
    email: str
