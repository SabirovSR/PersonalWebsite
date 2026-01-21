"""
Kafka consumer for processing contact messages.
"""

import asyncio
import json
import logging

from aiokafka import AIOKafkaConsumer, AIOKafkaProducer

from app.config import get_settings
from app.database.service import DatabaseService
from app.models import ContactMessage
from app.telegram.bot import send_notification

logger = logging.getLogger(__name__)


class KafkaConsumerService:
    """Async Kafka consumer for processing contact requests."""

    def __init__(self):
        self._consumer: AIOKafkaConsumer | None = None
        self._dlq_producer: AIOKafkaProducer | None = None
        self._settings = get_settings()
        self._running = False
        self._db = DatabaseService()

    async def start(self) -> None:
        """Start the Kafka consumer."""
        self._consumer = AIOKafkaConsumer(
            self._settings.kafka_topic,
            bootstrap_servers=self._settings.kafka_bootstrap_servers,
            group_id=self._settings.kafka_consumer_group,
            auto_offset_reset="earliest",
            enable_auto_commit=False,  # Manual commit for reliability
            value_deserializer=lambda m: json.loads(m.decode("utf-8")),
        )

        # DLQ producer for failed messages
        self._dlq_producer = AIOKafkaProducer(
            bootstrap_servers=self._settings.kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
        )

        await self._consumer.start()
        await self._dlq_producer.start()
        await self._db.connect()

        logger.info("Kafka consumer started")

    async def stop(self) -> None:
        """Stop the Kafka consumer."""
        self._running = False

        if self._consumer:
            await self._consumer.stop()
            self._consumer = None

        if self._dlq_producer:
            await self._dlq_producer.stop()
            self._dlq_producer = None

        await self._db.disconnect()

        logger.info("Kafka consumer stopped")

    async def run(self) -> None:
        """Run the consumer loop."""
        if self._consumer is None:
            raise RuntimeError("Consumer not started")

        self._running = True
        logger.info("Starting consumer loop...")

        while self._running:
            try:
                # Fetch messages with timeout
                messages = await self._consumer.getmany(
                    timeout_ms=1000,
                    max_records=10,
                )

                for tp, records in messages.items():
                    for record in records:
                        await self._process_message(record.value)

                        # Commit offset after successful processing
                        await self._consumer.commit()

            except asyncio.CancelledError:
                logger.info("Consumer loop cancelled")
                break
            except Exception as e:
                logger.exception(f"Error in consumer loop: {e}")
                await asyncio.sleep(5)  # Back off on error

    async def _process_message(self, data: dict) -> None:
        """Process a single contact message."""
        try:
            message = ContactMessage(**data)
            logger.info(f"Processing contact message: {message.id}")

            # 1. Save to database
            await self._db.save_contact(message)
            logger.info(f"Saved contact to database: {message.id}")

            # 2. Send Telegram notification with retry
            success = await self._send_with_retry(message)

            if not success:
                logger.error(f"Failed to send notification for {message.id}")
                await self._send_to_dlq(data, "telegram_notification_failed")

            logger.info(f"Successfully processed message: {message.id}")

        except Exception as e:
            logger.exception(f"Failed to process message: {e}")
            await self._send_to_dlq(data, str(e))

    async def _send_with_retry(
        self,
        message: ContactMessage,
        max_retries: int = 3,
    ) -> bool:
        """Send Telegram notification with exponential backoff retry."""
        for attempt in range(max_retries):
            try:
                success = await send_notification(message)
                if success:
                    return True
            except Exception as e:
                logger.warning(f"Notification attempt {attempt + 1} failed: {e}")

            if attempt < max_retries - 1:
                delay = 2**attempt  # Exponential backoff: 1, 2, 4 seconds
                await asyncio.sleep(delay)

        return False

    async def _send_to_dlq(self, data: dict, error: str) -> None:
        """Send failed message to Dead Letter Queue."""
        if self._dlq_producer is None:
            logger.error("DLQ producer not available")
            return

        try:
            dlq_message = {
                "original_message": data,
                "error": error,
            }

            await self._dlq_producer.send_and_wait(
                topic=self._settings.kafka_dlq_topic,
                value=dlq_message,
            )
            logger.info(f"Message sent to DLQ: {error}")
        except Exception as e:
            logger.exception(f"Failed to send to DLQ: {e}")
