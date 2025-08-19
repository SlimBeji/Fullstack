import mimetypes
import os
from typing import Any, Generic, Self, TypeVar, cast

from pydantic import BaseModel, GetJsonSchemaHandler
from pydantic_core import core_schema
from starlette.datastructures import UploadFile

from config import settings

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
    MAX_SIZE = settings.FILEUPLOAD_MAX_SIZE

    def __init__(self, filename: str, mimetype: str, buffer: bytes) -> None:
        self.name: str = filename
        self.mimetype = mimetype
        self.buffer: bytes = buffer

    @classmethod
    def from_path(cls, path: str) -> Self:
        filename = os.path.basename(path)
        mimetype = mimetypes.guess_type(path)[0] or "application/octet-stream"
        with open(path, "rb") as f:
            buffer = f.read()
        return cls(filename, mimetype, buffer)

    @classmethod
    def from_upload_file(cls, file: UploadFile) -> Self:
        name = cast(str, file.filename)
        content_type = cast(str, file.content_type)
        return cls(name, content_type, file.file.read())

    @classmethod
    def validate(cls, file: UploadFile | Self) -> Self:
        if isinstance(file, cls):
            if len(file.buffer) > cls.MAX_SIZE * 1024 * 1024:
                raise ValueError(f"File too large (> {cls.MAX_SIZE} MB)")
            return file

        upload_file = cast(UploadFile, file)
        buffer = upload_file.file.read()
        name = cast(str, upload_file.filename)
        mimetype = cast(str, upload_file.content_type)

        if len(buffer) > cls.MAX_SIZE * 1024 * 1024:
            raise ValueError(f"File too large (> {cls.MAX_SIZE} MB)")
        return cls(name, mimetype, buffer)

    @classmethod
    def __get_pydantic_core_schema__(cls, _source_type: Any, _handler: Any):
        return core_schema.no_info_after_validator_function(
            cls.validate,
            core_schema.union_schema(
                [
                    core_schema.is_instance_schema(UploadFile),
                    core_schema.is_instance_schema(cls),
                ]
            ),
        )

    @classmethod
    def __get_pydantic_json_schema__(
        cls, _core_schema: core_schema.CoreSchema, handler: GetJsonSchemaHandler
    ) -> dict[str, Any]:
        return dict(type="string", format="binary")

    @classmethod
    def __class_getitem__(cls, size_mb: int) -> type[Self]:
        class FileWithCustomLimit(cls):  # type: ignore
            MAX_SIZE = size_mb

        FileWithCustomLimit.__name__ = f"FileToUpload_{size_mb}MB"
        return FileWithCustomLimit
