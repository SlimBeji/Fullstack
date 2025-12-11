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
    ):
        # Metatdata
        self.default = default
        self.min_length = min_length
        self.max_length = max_length
        self.description = description
        self.examples = examples
        self.filter_examples = filter_examples
        self.is_file = is_file

        # HTTP Fields
        self.info = self._build_field()
        self.multipart = self._build_multpart_field()

    def _build_metadata(self) -> dict:
        metadata = dict(
            default=self.default,
            min_length=self.min_length,
            max_length=self.max_length,
            description=self.description,
            examples=self.examples,
        )

        if self.filter_examples:
            metadata["json_schema_extra"] = dict(
                filter_examples=self.filter_examples
            )

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
