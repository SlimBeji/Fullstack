from lib.utils import StrEnum


class Queues(StrEnum):
    EMAILS = "emails"
    AI = "ai"


class Tasks(StrEnum):
    NEWSLETTER = "newsletter"
    PLACE_EMBEDDING = "place_embedding"
