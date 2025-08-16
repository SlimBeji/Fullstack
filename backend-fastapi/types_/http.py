import mimetypes
import os
from typing import Generic, TypeVar, cast

from pydantic import BaseModel
from starlette.datastructures import UploadFile

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
    data: list[dict] | list[ReadSchema]


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

    @classmethod
    def from_upload_file(cls, file: UploadFile) -> "FileToUpload":
        name = cast(str, file.filename)
        content_type = cast(str, file.content_type)
        return cls(name, content_type, file.file.read())
