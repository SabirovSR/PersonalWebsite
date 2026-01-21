"""Tests for Kafka producer service."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models import ContactChannels, ContactFormRequest, ContactMessage, Contacts
from app.services.kafka_producer import KafkaProducerService


@pytest.fixture
def sample_contact_message() -> ContactMessage:
    """Create a sample contact message."""
    form_request = ContactFormRequest(
        name="John Doe",
        message="Test message",
        channels=[ContactChannels.telegram],
        contacts=Contacts(telegram="@johndoe"),
    )
    return ContactMessage(
        name=form_request.name,
        message=form_request.message,
        channels=form_request.channels,
        contacts=form_request.contacts,
    )


@pytest.mark.asyncio
async def test_kafka_producer_start():
    """Test starting Kafka producer."""
    with patch("app.services.kafka_producer.AIOKafkaProducer") as mock_producer_class:
        mock_producer = AsyncMock()
        mock_producer_class.return_value = mock_producer
        
        service = KafkaProducerService()
        await service.start()
        
        assert service._producer is not None
        mock_producer.start.assert_called_once()


@pytest.mark.asyncio
async def test_kafka_producer_stop():
    """Test stopping Kafka producer."""
    mock_producer = AsyncMock()
    
    service = KafkaProducerService()
    service._producer = mock_producer
    
    await service.stop()
    
    assert service._producer is None
    mock_producer.stop.assert_called_once()


@pytest.mark.asyncio
async def test_kafka_producer_send_success(sample_contact_message: ContactMessage):
    """Test successfully sending a message to Kafka."""
    mock_producer = AsyncMock()
    mock_producer.send_and_wait = AsyncMock()
    
    service = KafkaProducerService()
    service._producer = mock_producer
    
    result = await service.send_contact_message(sample_contact_message)
    
    assert result is True
    mock_producer.send_and_wait.assert_called_once()


@pytest.mark.asyncio
async def test_kafka_producer_send_not_started(sample_contact_message: ContactMessage):
    """Test sending message when producer not started."""
    service = KafkaProducerService()
    # Don't start producer
    
    result = await service.send_contact_message(sample_contact_message)
    
    assert result is False


@pytest.mark.asyncio
async def test_kafka_producer_send_failure(sample_contact_message: ContactMessage):
    """Test handling Kafka send failure."""
    mock_producer = AsyncMock()
    mock_producer.send_and_wait = AsyncMock(side_effect=Exception("Kafka error"))
    
    service = KafkaProducerService()
    service._producer = mock_producer
    
    result = await service.send_contact_message(sample_contact_message)
    
    assert result is False


@pytest.mark.asyncio
async def test_kafka_producer_idempotent_start():
    """Test that calling start multiple times doesn't create multiple producers."""
    with patch("app.services.kafka_producer.AIOKafkaProducer") as mock_producer_class:
        mock_producer = AsyncMock()
        mock_producer_class.return_value = mock_producer
        
        service = KafkaProducerService()
        await service.start()
        await service.start()  # Call again
        
        # Producer should be initialized only once
        assert mock_producer_class.call_count == 1
