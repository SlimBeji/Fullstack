from typing import Any

from fastapi import File, Form
from pydantic import Field
from pydantic.fields import FieldInfo


class FieldMeta:
    def __init__(
        self,
        default: Any = ...,
        min_length: int | None = None,
        max_length: int | None = None,
        description: str | None = None,
        examples: list | None = None,
        filter_examples: list | None = None,
        is_file: bool = False,
        is_index: bool = False,
    ):
        # Metatdata
        self.default = default
        self.min_length = min_length
        self.max_length = max_length
        self.description = description
        self.examples = examples
        self.filter_examples = filter_examples
        self.is_file = is_file
        self.is_index = is_index

        # HTTP Fields
        self.info = self._build_field()
        self.multipart = self._build_multpart_field()
        self.optional_multipart = self._build_multpart_optional_field()

    def _build_metadata(self) -> dict:
        metadata = dict(
            default=self.default,
            min_length=self.min_length,
            max_length=self.max_length,
            description=self.description,
            examples=self.examples,
        )

        json_schema_extra: dict[str, Any] = {}
        if self.filter_examples:
            json_schema_extra["filter_examples"] = self.filter_examples
        if self.is_index:
            json_schema_extra["is_index"] = self.is_index
        if json_schema_extra:
            metadata["json_schema_extra"] = json_schema_extra

        return metadata

    def _build_field(self) -> FieldInfo:
        if self.is_file:
            return File(description=self.description)

        metatdata = self._build_metadata()
        return Field(**metatdata)

    def _build_multpart_field(self) -> Any:
        if self.is_file:
            return File(description=self.description)

        metatdata = self._build_metadata()
        return Form(**metatdata)

    def _build_multpart_optional_field(self) -> Any:
        if self.is_file:
            return File(None, description=self.description)

        metatdata = self._build_metadata()
        return Form(**metatdata)
