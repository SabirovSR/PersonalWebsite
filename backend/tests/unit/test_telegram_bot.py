"""Tests for Telegram bot."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from aiogram.types import Message, User

from app.models import ContactChannel, ContactInfo, ContactMessage, ContactTariff, FormSource
from app.telegram.bot import _escape_html, send_notification


@pytest.fixture
def sample_contact_message() -> ContactMessage:
    """Create a sample contact message."""
    return ContactMessage(
        name="John Doe",
        message="Test message with <html> tags & special chars",
        channels=[ContactChannel.TELEGRAM, ContactChannel.EMAIL],
        contacts=ContactInfo(
            telegram="@johndoe",
            email="john@example.com",
        ),
        ip_address="192.168.1.1",
    )


def test_escape_html():
    """Test HTML escaping function."""
    text = "Hello <world> & friends"
    escaped = _escape_html(text)
    
    assert "&lt;" in escaped
    assert "&gt;" in escaped
    assert "&amp;" in escaped
    assert "<" not in escaped
    assert ">" not in escaped
    assert " & " not in escaped


def test_escape_html_no_special_chars():
    """Test HTML escaping with no special characters."""
    text = "Hello world"
    escaped = _escape_html(text)
    
    assert escaped == text


@pytest.mark.asyncio
async def test_send_notification_success(sample_contact_message: ContactMessage):
    """Test successfully sending a Telegram notification."""
    mock_bot = MagicMock()
    mock_bot.send_message = AsyncMock()
    
    with patch("app.telegram.bot.bot", mock_bot):
        with patch("app.telegram.bot.settings") as mock_settings:
            mock_settings.telegram_owner_id = 123456789
            
            result = await send_notification(sample_contact_message)
            
            assert result is True
            mock_bot.send_message.assert_called_once()
            
            # Check that message was sent to owner
            call_args = mock_bot.send_message.call_args
            assert call_args.kwargs["chat_id"] == 123456789
            assert call_args.kwargs["parse_mode"] == "HTML"
            
            # Check message contains contact info
            message_text = call_args.kwargs["text"]
            assert "John Doe" in message_text
            assert "@johndoe" in message_text
            assert "john@example.com" in message_text
            assert "Главная страница" in message_text


@pytest.mark.asyncio
async def test_send_notification_bot_not_initialized(sample_contact_message: ContactMessage):
    """Test sending notification when bot is not initialized."""
    with patch("app.telegram.bot.bot", None):
        result = await send_notification(sample_contact_message)
        
        assert result is False


@pytest.mark.asyncio
async def test_send_notification_no_owner_id(sample_contact_message: ContactMessage):
    """Test sending notification when owner ID not configured."""
    mock_bot = MagicMock()
    
    with patch("app.telegram.bot.bot", mock_bot):
        with patch("app.telegram.bot.settings") as mock_settings:
            mock_settings.telegram_owner_id = None
            
            result = await send_notification(sample_contact_message)
            
            assert result is False


@pytest.mark.asyncio
async def test_send_notification_telegram_error(sample_contact_message: ContactMessage):
    """Test handling Telegram API error."""
    mock_bot = MagicMock()
    mock_bot.send_message = AsyncMock(side_effect=Exception("Telegram API error"))
    
    with patch("app.telegram.bot.bot", mock_bot):
        with patch("app.telegram.bot.settings") as mock_settings:
            mock_settings.telegram_owner_id = 123456789
            
            result = await send_notification(sample_contact_message)
            
            assert result is False


@pytest.mark.asyncio
async def test_send_notification_formats_telegram_username(sample_contact_message: ContactMessage):
    """Test that Telegram username is formatted with @ if missing."""
    # Create message with username without @
    message = ContactMessage(
        name="Jane Doe",
        message="Test",
        channels=[ContactChannel.TELEGRAM],
        contacts=ContactInfo(telegram="janedoe"),  # No @ prefix
    )
    
    mock_bot = MagicMock()
    mock_bot.send_message = AsyncMock()
    
    with patch("app.telegram.bot.bot", mock_bot):
        with patch("app.telegram.bot.settings") as mock_settings:
            mock_settings.telegram_owner_id = 123456789
            
            await send_notification(message)
            
            # Check that @ was added
            call_args = mock_bot.send_message.call_args
            message_text = call_args.kwargs["text"]
            assert "@janedoe" in message_text


@pytest.mark.asyncio
async def test_send_notification_html_escaping(sample_contact_message: ContactMessage):
    """Test that special HTML characters are properly escaped."""
    mock_bot = MagicMock()
    mock_bot.send_message = AsyncMock()
    
    with patch("app.telegram.bot.bot", mock_bot):
        with patch("app.telegram.bot.settings") as mock_settings:
            mock_settings.telegram_owner_id = 123456789
            
            await send_notification(sample_contact_message)
            
            call_args = mock_bot.send_message.call_args
            message_text = call_args.kwargs["text"]
            
            # Original message has <html>, should be escaped
            assert "&lt;html&gt;" in message_text
            assert "<html>" not in message_text


@pytest.mark.asyncio
async def test_send_notification_business_tariff():
    """Business inquiries show tier and distinct header."""
    message = ContactMessage(
        name="Biz Client",
        message="Need CRM bridge",
        channels=[ContactChannel.TELEGRAM],
        contacts=ContactInfo(telegram="@biz"),
        form_source=FormSource.BUSINESS,
        tariff=ContactTariff.ADVANCED,
    )
    mock_bot = MagicMock()
    mock_bot.send_message = AsyncMock()

    with patch("app.telegram.bot.bot", mock_bot):
        with patch("app.telegram.bot.settings") as mock_settings:
            mock_settings.telegram_owner_id = 123456789

            result = await send_notification(message)

            assert result is True
            text = mock_bot.send_message.call_args.kwargs["text"]
            assert "Заявка (бизнес)" in text
            assert "Страница «Для бизнеса»" in text
            assert "Продвинутый" in text
