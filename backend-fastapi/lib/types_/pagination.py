from typing import Generic, TypeVar

from pydantic import BaseModel

ReadSchema = TypeVar("ReadSchema", bound=BaseModel)


class PaginationData(BaseModel):
    page: int
    size: int

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.size


class PaginatedData(BaseModel, Generic[ReadSchema]):
    page: int
    totalPages: int
    totalCount: int
    data: list[ReadSchema] | list[dict]
