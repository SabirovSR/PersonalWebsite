"""
Telegram webhook endpoint.
"""

import logging

from aiogram import types
from fastapi import APIRouter, HTTPException, status

from app.config import get_settings
from app.telegram.bot import bot, dp

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/webhook/{secret}")
async def telegram_webhook(secret: str, update: dict):
    """
    Handle incoming Telegram webhook updates.

    The secret in the URL provides an additional layer of security.
    """
    settings = get_settings()

    # Validate webhook secret
    if secret != settings.telegram_webhook_secret:
        logger.warning("Invalid webhook secret attempted")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid webhook secret",
        )

    try:
        # Parse and process the update
        telegram_update = types.Update(**update)
        await dp.feed_update(bot, telegram_update)
        return {"ok": True}
    except Exception as e:
        logger.exception(f"Error processing Telegram update: {e}")
        # Return OK to prevent Telegram from retrying
        return {"ok": True}
