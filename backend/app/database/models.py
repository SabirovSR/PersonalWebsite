"""
SQLAlchemy database models.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import JSON, DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """Base class for all models."""

    pass


class ContactRecord(Base):
    """Contact form submission record."""

    __tablename__ = "contacts"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    channels: Mapped[dict] = mapped_column(JSON, nullable=False)  # List of channel names
    contacts: Mapped[dict] = mapped_column(JSON, nullable=False)  # Contact info dict
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    processed_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow,
    )

    def __repr__(self) -> str:
        return f"<ContactRecord {self.id} from {self.name}>"
