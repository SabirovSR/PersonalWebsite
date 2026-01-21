"""
Database service for contact storage.
"""

import logging

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.models import ContactMessage

from .models import Base, ContactRecord

logger = logging.getLogger(__name__)


class DatabaseService:
    """Async database service for contact operations."""

    def __init__(self):
        self._engine = None
        self._session_factory = None
        self._settings = get_settings()

    async def connect(self) -> None:
        """Initialize database connection."""
        self._engine = create_async_engine(
            self._settings.postgres_url,
            echo=self._settings.debug,
            pool_size=5,
            max_overflow=10,
        )

        self._session_factory = async_sessionmaker(
            self._engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

        # Create tables if they don't exist
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database connected")

    async def disconnect(self) -> None:
        """Close database connection."""
        if self._engine:
            await self._engine.dispose()
            self._engine = None
            self._session_factory = None
        logger.info("Database disconnected")

    async def save_contact(self, message: ContactMessage) -> ContactRecord:
        """Save a contact message to the database."""
        if self._session_factory is None:
            raise RuntimeError("Database not connected")

        record = ContactRecord(
            id=message.id,
            name=message.name,
            message=message.message,
            channels=[c.value for c in message.channels],
            contacts=message.contacts.model_dump(),
            ip_address=message.ip_address,
            user_agent=message.user_agent,
            created_at=message.created_at,
        )

        async with self._session_factory() as session:
            session.add(record)
            await session.commit()
            logger.info(f"Contact saved to database: {record.id}")
            return record
