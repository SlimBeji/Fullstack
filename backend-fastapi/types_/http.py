from typing import Generic, TypeVar

from pydantic import BaseModel

ReadSchema = TypeVar("ReadSchema", bound=BaseModel)


class PaginationData(BaseModel):
    page: int
    size: int
    skip: int


class PaginatedData(BaseModel, Generic[ReadSchema]):
    page: int
    totalPages: int
    totalCount: int
    data: list[ReadSchema]
