"""
API routes.
"""

from fastapi import APIRouter

from .contact import router as contact_router
from .health import router as health_router
from .telegram import router as telegram_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(contact_router, prefix="/public", tags=["contact"])
api_router.include_router(telegram_router, prefix="/telegram", tags=["telegram"])

__all__ = ["api_router"]
