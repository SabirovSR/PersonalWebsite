"""
Telegram bot for receiving contact notifications.
"""

import logging
from typing import Any

from aiogram import Bot, Dispatcher
from aiogram.filters import Command
from aiogram.types import Message

from app.config import get_settings
from app.models import ContactMessage

logger = logging.getLogger(__name__)

settings = get_settings()

# Initialize bot and dispatcher
bot = Bot(token=settings.telegram_bot_token) if settings.telegram_bot_token else None
dp = Dispatcher()


# Middleware to restrict access to owner only
@dp.message.middleware()
async def auth_middleware(handler, event: Message, data: dict) -> Any:
    """Only allow messages from the owner."""
    if event.from_user is None:
        return None
    if event.from_user.id != settings.telegram_owner_id:
        logger.warning(f"Unauthorized access attempt from user {event.from_user.id}")
        return None  # Ignore messages from unauthorized users
    return await handler(event, data)


@dp.message(Command("start"))
async def cmd_start(message: Message):
    """Handle /start command."""
    await message.answer(
        "👋 Привет! Я бот для уведомлений с сайта sabirov.tech.\n\n"
        "Я буду передавать вам сообщения, когда кто-то оставит заявку на сайте.\n\n"
        "Команды:\n"
        "/status - Проверить статус бота"
    )


@dp.message(Command("status"))
async def cmd_status(message: Message):
    """Handle /status command."""
    user_id = message.from_user.id if message.from_user else "Unknown"
    await message.answer(
        "✅ Бот работает нормально!\n\n"
        f"🔔 Уведомления: Включены\n"
        f"👤 Твой ID: {user_id}"
    )


async def send_notification(contact: ContactMessage) -> bool:
    """
    Send a notification about new contact form submission.

    Returns True if successful, False otherwise.
    """
    if bot is None:
        logger.error("Telegram bot not initialized")
        return False

    if not settings.telegram_owner_id:
        logger.error("Telegram owner ID not configured")
        return False

    # Format contacts
    contacts_text = []
    for channel in contact.channels:
        value = getattr(contact.contacts, channel.value, None)
        if value:
            channel_emoji = {
                "email": "📧",
                "telegram": "💬",
                "vk": "💙",
                "phone": "📱",
                "website": "🌐",
                "max": "💜",
                "whatsapp": "📲",  # Deprecated
            }.get(channel.value, "📎")

            channel_name = {
                "email": "Email",
                "telegram": "Telegram",
                "vk": "VK",
                "phone": "Телефон",
                "website": "Сайт",
                "max": "MAX",
                "whatsapp": "WhatsApp",  # Deprecated
            }.get(channel.value, channel.value)

            # Format telegram username with @
            if channel.value == "telegram" and not value.startswith("@"):
                value = f"@{value}"

            contacts_text.append(f"{channel_emoji} {channel_name}: {value}")

    # Format timestamp
    timestamp = contact.created_at.strftime("%d.%m.%Y %H:%M")

    # Build message
    text = (
        f"📬 <b>Новая заявка с сайта!</b>\n\n"
        f"👤 <b>Имя:</b> {_escape_html(contact.name)}\n\n"
        f"📝 <b>Сообщение:</b>\n{_escape_html(contact.message)}\n\n"
        f"📞 <b>Способы связи:</b>\n"
    )
    text += "\n".join(f"• {c}" for c in contacts_text)
    text += f"\n\n🕐 {timestamp}"

    try:
        await bot.send_message(
            chat_id=settings.telegram_owner_id,
            text=text,
            parse_mode="HTML",
        )
        logger.info(f"Notification sent for contact {contact.id}")
        return True
    except Exception as e:
        logger.exception(f"Failed to send Telegram notification: {e}")
        return False


def _escape_html(text: str) -> str:
    """Escape HTML special characters."""
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


async def setup_webhook() -> None:
    """Set up Telegram webhook."""
    if bot is None:
        logger.warning("Telegram bot not initialized, skipping webhook setup")
        return

    webhook_url = settings.telegram_webhook_url
    if not webhook_url:
        logger.warning("Telegram webhook URL not configured")
        return

    # Add secret to webhook URL
    full_url = f"{webhook_url}/api/telegram/webhook/{settings.telegram_webhook_secret}"

    try:
        await bot.set_webhook(
            url=full_url,
            drop_pending_updates=True,
        )
        logger.info(f"Telegram webhook set to {webhook_url}")
    except Exception as e:
        logger.exception(f"Failed to set Telegram webhook: {e}")


async def shutdown_webhook() -> None:
    """Remove Telegram webhook on shutdown."""
    if bot is None:
        return

    try:
        await bot.delete_webhook()
        await bot.session.close()
        logger.info("Telegram webhook removed")
    except Exception as e:
        logger.exception(f"Failed to remove Telegram webhook: {e}")
