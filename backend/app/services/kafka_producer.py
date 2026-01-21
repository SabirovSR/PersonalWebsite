"""
Kafka producer service for sending contact messages.
"""

import json
import logging

from aiokafka import AIOKafkaProducer

from app.config import get_settings
from app.models import ContactMessage

logger = logging.getLogger(__name__)


class KafkaProducerService:
    """Async Kafka producer for contact messages."""

    def __init__(self):
        self._producer: AIOKafkaProducer | None = None
        self._settings = get_settings()

    async def start(self) -> None:
        """Start the Kafka producer."""
        if self._producer is not None:
            return

        self._producer = AIOKafkaProducer(
            bootstrap_servers=self._settings.kafka_bootstrap_servers,
            value_serializer=lambda v: json.dumps(v).encode("utf-8"),
            key_serializer=lambda k: k.encode("utf-8") if k else None,
            acks="all",  # Wait for all replicas
            enable_idempotence=True,  # Exactly-once semantics
        )
        await self._producer.start()
        logger.info("Kafka producer started")

    async def stop(self) -> None:
        """Stop the Kafka producer."""
        if self._producer is not None:
            await self._producer.stop()
            self._producer = None
            logger.info("Kafka producer stopped")

    async def send_contact_message(self, message: ContactMessage) -> bool:
        """
        Send a contact message to Kafka.

        Returns True if successful, False otherwise.
        """
        if self._producer is None:
            logger.error("Kafka producer not started")
            return False

        try:
            # Serialize the message
            message_dict = message.model_dump(mode="json")

            # Send to Kafka
            await self._producer.send_and_wait(
                topic=self._settings.kafka_topic,
                value=message_dict,
                key=str(message.id),
            )

            logger.info(f"Contact message sent to Kafka: {message.id}")
            return True

        except Exception as e:
            logger.exception(f"Failed to send message to Kafka: {e}")
            return False


# Global producer instance
kafka_producer = KafkaProducerService()
