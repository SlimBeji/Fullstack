from datetime import datetime
from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lib.sqlalchemy_ import BaseModel

if TYPE_CHECKING:
    from .place import Place


class User(BaseModel):
    """User model"""

    __tablename__ = "users"

    # Fixing mypy bug by referencing again the inherited fields
    id: Mapped[int]
    created_at: Mapped[datetime]
    updated_at: Mapped[datetime]

    # Fields
    name: Mapped[str] = mapped_column(Text, nullable=False)

    email: Mapped[str] = mapped_column(Text, unique=True, nullable=False)

    password: Mapped[str] = mapped_column(Text, nullable=False)

    image_url: Mapped[Optional[str]] = mapped_column(
        Text, nullable=False, server_default=""
    )

    is_admin: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Relationships
    places: Mapped[list["Place"]] = relationship(
        "Place", back_populates="creator", cascade="all, delete-orphan"
    )
