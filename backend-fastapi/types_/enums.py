from lib.utils import StrEnum


class Collections(StrEnum):
    USERS = "users"
    PLACES = "places"


class Queues(StrEnum):
    EMAILS = "emails"
    AI = "ai"


class Tasks(StrEnum):
    NEWSLETTER = "newsletter"
    PLACE_EMBEDDING = "place_embedding"
