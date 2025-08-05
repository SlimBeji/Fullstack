import mimetypes
import os
from typing import Generic, TypeVar

from pydantic import BaseModel, computed_field

ReadSchema = TypeVar("ReadSchema", bound=BaseModel)


class PaginationData(BaseModel):
    page: int
    size: int

    @computed_field
    def skip(self) -> int:
        return (self.page - 1) * self.size


class PaginatedData(BaseModel, Generic[ReadSchema]):
    page: int
    totalPages: int
    totalCount: int
    data: list[ReadSchema]


class FileToUpload:
    def __init__(self, filename: str, mimetype: str, buffer: bytes) -> None:
        self.name: str = filename
        self.mimetype = mimetype
        self.buffer: bytes = buffer

    @classmethod
    def from_path(cls, path: str) -> "FileToUpload":
        filename = os.path.basename(path)
        mimetype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        with open(path, "rb") as f:
            buffer = f.read()
        return cls(filename, mimetype, buffer)
