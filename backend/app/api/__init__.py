"""
API routes.
"""

from fastapi import APIRouter

from .blog import router as blog_router
from .contact import router as contact_router
from .health import router as health_router
from .status import router as status_router
from .telegram import router as telegram_router
from .ws import router as ws_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(contact_router, prefix="/public", tags=["contact"])
api_router.include_router(status_router, prefix="/public", tags=["status"])
api_router.include_router(blog_router, prefix="/public", tags=["blog"])
api_router.include_router(telegram_router, prefix="/telegram", tags=["telegram"])
api_router.include_router(ws_router, tags=["websocket"])

__all__ = ["api_router"]
