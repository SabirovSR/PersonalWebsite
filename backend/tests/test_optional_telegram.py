"""A deployment without Telegram must still durably process contact requests."""
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

from app.kafka.consumer import KafkaConsumerService


class OptionalTelegramTests(unittest.IsolatedAsyncioTestCase):
    async def check_storage(self, fail):
        consumer = KafkaConsumerService()
        consumer._settings = SimpleNamespace(telegram_bot_token='')
        consumer._db = SimpleNamespace(save_contact=AsyncMock(
            side_effect=RuntimeError('database unavailable') if fail else None))
        consumer._send_with_retry = AsyncMock()
        with patch('app.kafka.consumer.ContactMessage.model_validate',
                   return_value=SimpleNamespace(id='test-contact')):
            result = await consumer._process_message({})
        consumer._send_with_retry.assert_not_awaited()
        return result

    async def test_saved_contact_is_acknowledged_without_telegram(self):
        self.assertTrue(await self.check_storage(False))

    async def test_database_failure_is_not_acknowledged(self):
        self.assertFalse(await self.check_storage(True))
