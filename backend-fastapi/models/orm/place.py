from typing import TYPE_CHECKING, Optional

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lib.sqlalchemy_ import BaseModel

if TYPE_CHECKING:
    from .user import User


class Place(BaseModel):
    __tablename__ = "places"
    __table_args__ = (Index("idx_place_creator", "creator_id"),)

    # Fields
    title: Mapped[str] = mapped_column(String, nullable=False)

    description: Mapped[str] = mapped_column(Text, nullable=False)

    address: Mapped[str] = mapped_column(String, nullable=False)

    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    location: Mapped[dict] = mapped_column(JSONB, nullable=False)

    # PgVector
    embedding: Mapped[Optional[list[float]]] = mapped_column(
        Vector(384), nullable=True
    )

    # Relationships

    creator_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    creator: Mapped["User"] = relationship("User", back_populates="places")
