"""
Database service for contact and blog storage.
"""

import logging
import re
import unicodedata
from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import get_settings
from app.models import ContactMessage

from .models import Base, BlogPost, ContactRecord

logger = logging.getLogger(__name__)


def _slugify(text: str) -> str:
    """Convert text to a URL-safe slug."""
    text = unicodedata.normalize("NFKD", text)
    text = text.encode("ascii", "ignore").decode("ascii")
    text = text.lower()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = text.strip("-")
    return text or "post"


class DatabaseService:
    """Async database service for contact and blog operations."""

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

        # Create tables if they don't exist, then ensure new columns on existing DBs
        # (create_all does not ALTER existing tables)
        async with self._engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
            if self._settings.postgres_url.startswith("postgresql"):
                await conn.execute(
                    text(
                        "ALTER TABLE contacts ADD COLUMN IF NOT EXISTS form_source VARCHAR(32)"
                    )
                )
                await conn.execute(
                    text("ALTER TABLE contacts ADD COLUMN IF NOT EXISTS tariff VARCHAR(32)")
                )

        logger.info("Database connected")

    async def disconnect(self) -> None:
        """Close database connection."""
        if self._engine:
            await self._engine.dispose()
            self._engine = None
            self._session_factory = None
        logger.info("Database disconnected")

    # ------------------------------------------------------------------
    # Contact operations
    # ------------------------------------------------------------------

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
            form_source=message.form_source.value,
            tariff=message.tariff.value if message.tariff else None,
            ip_address=message.ip_address,
            user_agent=message.user_agent,
            created_at=message.created_at,
        )

        async with self._session_factory() as session:
            session.add(record)
            await session.commit()
            logger.info(f"Contact saved to database: {record.id}")
            return record

    # ------------------------------------------------------------------
    # Blog operations
    # ------------------------------------------------------------------

    async def create_blog_post(
        self, title: str, content: str, published: bool = False
    ) -> BlogPost:
        """Create a new blog post."""
        if self._session_factory is None:
            raise RuntimeError("Database not connected")

        base_slug = _slugify(title)
        slug = base_slug

        async with self._session_factory() as session:
            # Ensure slug uniqueness
            counter = 1
            while True:
                existing = await session.scalar(
                    select(BlogPost).where(BlogPost.slug == slug)
                )
                if existing is None:
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1

            post = BlogPost(
                id=uuid4(),
                title=title,
                content=content,
                slug=slug,
                published=published,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow(),
            )
            session.add(post)
            await session.commit()
            logger.info(f"Blog post created: {post.id} '{post.title}'")
            return post

    async def list_published_blog_posts(self) -> list[BlogPost]:
        """Return all published posts ordered by creation date (newest first)."""
        if self._session_factory is None:
            raise RuntimeError("Database not connected")

        async with self._session_factory() as session:
            result = await session.execute(
                select(BlogPost)
                .where(BlogPost.published.is_(True))
                .order_by(BlogPost.created_at.desc())
            )
            return list(result.scalars().all())

    async def list_all_blog_posts(self) -> list[BlogPost]:
        """Return all posts (including drafts) ordered by creation date (newest first)."""
        if self._session_factory is None:
            raise RuntimeError("Database not connected")

        async with self._session_factory() as session:
            result = await session.execute(
                select(BlogPost).order_by(BlogPost.created_at.desc())
            )
            return list(result.scalars().all())

    async def get_blog_post_by_slug(self, slug: str) -> BlogPost | None:
        """Fetch a published blog post by its slug."""
        if self._session_factory is None:
            raise RuntimeError("Database not connected")

        async with self._session_factory() as session:
            return await session.scalar(
                select(BlogPost)
                .where(BlogPost.slug == slug, BlogPost.published.is_(True))
            )

    async def get_blog_post_by_id(self, post_id: str) -> BlogPost | None:
        """Fetch a blog post by its UUID (any publish state)."""
        if self._session_factory is None:
            raise RuntimeError("Database not connected")

        async with self._session_factory() as session:
            return await session.scalar(
                select(BlogPost).where(BlogPost.id == UUID(post_id))
            )

    async def toggle_blog_post_published(self, post_id: str) -> BlogPost:
        """Toggle the published flag of a post."""
        if self._session_factory is None:
            raise RuntimeError("Database not connected")

        async with self._session_factory() as session:
            post = await session.scalar(
                select(BlogPost).where(BlogPost.id == UUID(post_id))
            )
            if post is None:
                raise ValueError(f"Post {post_id} not found")
            post.published = not post.published
            post.updated_at = datetime.utcnow()
            await session.commit()
            return post

    async def update_blog_post_content(self, post_id: str, content: str) -> BlogPost:
        """Update the content of an existing post."""
        if self._session_factory is None:
            raise RuntimeError("Database not connected")

        async with self._session_factory() as session:
            post = await session.scalar(
                select(BlogPost).where(BlogPost.id == UUID(post_id))
            )
            if post is None:
                raise ValueError(f"Post {post_id} not found")
            post.content = content
            post.updated_at = datetime.utcnow()
            await session.commit()
            return post

    async def delete_blog_post(self, post_id: str) -> None:
        """Delete a blog post by its UUID."""
        if self._session_factory is None:
            raise RuntimeError("Database not connected")

        async with self._session_factory() as session:
            post = await session.scalar(
                select(BlogPost).where(BlogPost.id == UUID(post_id))
            )
            if post is not None:
                await session.delete(post)
                await session.commit()
                logger.info(f"Blog post deleted: {post_id}")
