"""
Telegram bot module.
"""
from .bot import bot, dp, send_notification, setup_webhook, shutdown_webhook

__all__ = ["bot", "dp", "send_notification", "setup_webhook", "shutdown_webhook"]
