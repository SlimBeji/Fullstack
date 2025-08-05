from datetime import UTC, datetime
from functools import partial

from beanie import Document, before_event
from pydantic import Field

from types_ import SaveEvent


class BaseDocument(Document):
    createdAt: datetime = Field(default_factory=partial(datetime.now, UTC))
    updatedAt: datetime = Field(default_factory=partial(datetime.now, UTC))

    @before_event(SaveEvent)
    def update_timestamp(self):
        self.updatedAt = datetime.now(UTC)


# document_registery used to avoid circular imports
document_registry: dict[str, type[Document]] = {}
