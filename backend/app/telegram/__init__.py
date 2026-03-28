"""
Telegram bot module.
"""

from .bot import bot, dp, send_notification, start_telegram_polling, stop_telegram_polling

__all__ = [
    "bot",
    "dp",
    "send_notification",
    "start_telegram_polling",
    "stop_telegram_polling",
]
