from datetime import datetime
from typing import TYPE_CHECKING

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Index, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lib.sqlalchemy_ import BaseModel

if TYPE_CHECKING:
    from .user import User


class Place(BaseModel):
    __tablename__ = "places"
    __table_args__ = (Index("idx_place_creator", "creator_id"),)

    # Fixing mypy bug by referencing again the inherited fields
    id: Mapped[int]
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]

    # Fields
    title: Mapped[str] = mapped_column(Text, nullable=False)

    description: Mapped[str] = mapped_column(Text, nullable=False)

    address: Mapped[str] = mapped_column(Text, nullable=False)

    image_url: Mapped[str | None] = mapped_column(
        Text, nullable=False, server_default=""
    )

    location: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # PgVector
    embedding: Mapped[list[float] | None] = mapped_column(
        Vector(384), nullable=True
    )

    # Relationships

    creator_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    creator: Mapped["User"] = relationship("User", back_populates="places")
