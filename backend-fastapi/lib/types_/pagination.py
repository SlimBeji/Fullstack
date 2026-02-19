from dataclasses import dataclass
from typing import Generic, TypeVar

from pydantic import BaseModel

ReadSchema = TypeVar("ReadSchema", bound=BaseModel)


@dataclass
class PaginationData:
    page: int
    size: int

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.size


class PaginatedDict(BaseModel):
    page: int
    totalPages: int
    totalCount: int
    data: list[dict]


class PaginatedData(BaseModel, Generic[ReadSchema]):
    page: int
    totalPages: int
    totalCount: int
    data: list[ReadSchema]
