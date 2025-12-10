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
