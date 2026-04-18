from enum import Enum
from enum import StrEnum as BaseStrEnum


class StrEnum(BaseStrEnum):
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
