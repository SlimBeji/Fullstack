from dataclasses import dataclass

from pydantic import BaseModel, Field


@dataclass
class PaginationData:
    page: int
    size: int

    @property
    def skip(self) -> int:
        return (self.page - 1) * self.size


class PaginatedDict(BaseModel):
    """Using camelCase to stay coherent with other backends"""

    page: int
    total_pages: int
    total_count: int
    data: list[dict]


class PaginatedData[ReadSchema: BaseModel](BaseModel):
    """Using camelCase to stay coherent with other backends"""

    page: int = Field(examples=[1])
    total_pages: int = Field(examples=[2])
    total_count: int = Field(examples=[40])
    data: list[ReadSchema]
