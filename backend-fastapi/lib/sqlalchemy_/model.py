from datetime import datetime

from sqlalchemy import DateTime, Integer, inspect
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.sql import func


class BaseModel(DeclarativeBase):
    __abstract__ = True

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, autoincrement=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True,
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    def to_dict(self) -> dict:
        result = {}
        insp = inspect(self)

        for c in insp.mapper.column_attrs:
            if c.key not in insp.unloaded:
                result[c.key] = getattr(self, c.key)

        for c in insp.mapper.relationships:
            if c.key not in insp.unloaded:
                val = getattr(self, c.key)
                if val is not None:
                    if isinstance(val, list):
                        result[c.key] = [item.to_dict() for item in val]
                    else:
                        result[c.key] = val.to_dict()

        return result
