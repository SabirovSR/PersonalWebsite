"""
Public blog endpoints.
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database.service import DatabaseService

router = APIRouter()


class BlogPostResponse(BaseModel):
    id: str
    title: str
    content: str
    slug: str
    published: bool
    created_at: datetime
    updated_at: datetime


def _serialize(post) -> BlogPostResponse:
    return BlogPostResponse(
        id=str(post.id),
        title=post.title,
        content=post.content,
        slug=post.slug,
        published=post.published,
        created_at=post.created_at,
        updated_at=post.updated_at,
    )


@router.get("/blog", response_model=list[BlogPostResponse])
async def list_posts():
    """Return all published blog posts, newest first."""
    db = DatabaseService()
    await db.connect()
    try:
        posts = await db.list_published_blog_posts()
        return [_serialize(p) for p in posts]
    finally:
        await db.disconnect()


@router.get("/blog/{slug}", response_model=BlogPostResponse)
async def get_post(slug: str):
    """Return a single published blog post by slug."""
    db = DatabaseService()
    await db.connect()
    try:
        post = await db.get_blog_post_by_slug(slug)
        if post is None:
            raise HTTPException(status_code=404, detail="Post not found")
        return _serialize(post)
    finally:
        await db.disconnect()
