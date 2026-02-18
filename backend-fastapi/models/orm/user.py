from typing import TYPE_CHECKING, Optional

from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from lib.sqlalchemy_ import BaseModel

if TYPE_CHECKING:
    from .place import Place


class User(BaseModel):
    """User model"""

    __tablename__ = "users"

    # Fields
    name: Mapped[str] = mapped_column(String, nullable=False)

    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)

    password: Mapped[str] = mapped_column(String, nullable=False)

    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    is_admin: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )

    # Relationships
    places: Mapped[list["Place"]] = relationship(
        "Place", back_populates="creator", cascade="all, delete-orphan"
    )
