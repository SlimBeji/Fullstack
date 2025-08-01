from enum import Enum


class StrEnum(str, Enum):
    def __str__(self):
        return self.value

    @classmethod
    def values(cls) -> list[str]:
        return [e.value for e in cls]


class FloatEnum(float, Enum):
    def __str__(self):
        return str(self.value)

    @classmethod
    def values(cls) -> list[float]:
        return [e.value for e in cls]


class ContentType(StrEnum):
    Multipart_Form_Data = "multipart/form-data"
    Application_Json = "application/json"


class MimeType(StrEnum):
    JPEG = "image/jpeg"
    PNG = "image/png"


class Collections(StrEnum):
    USERS = "users"
    PLACES = "places"


class Queues(StrEnum):
    EMAILS = "emails"
    AI = "ai"


class Tasks(StrEnum):
    NEWSLETTER = "newsletter"
    PLACE_EMBEDDING = "place_embedding"
