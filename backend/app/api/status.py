"""
Public status endpoint — returns the owner's current status.
"""

from fastapi import APIRouter
from pydantic import BaseModel

from app.services.status_service import status_service

router = APIRouter()


class StatusResponse(BaseModel):
    code: str
    emoji: str
    label_ru: str
    label_en: str
    color: str
    updated_at: str | None = None


@router.get("/status", response_model=StatusResponse)
async def get_status():
    """Return the owner's current status."""
    return await status_service.get_status()
