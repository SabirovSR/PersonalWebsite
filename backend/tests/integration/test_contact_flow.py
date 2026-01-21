"""Integration tests for complete contact form flow."""
from unittest.mock import AsyncMock, patch

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_complete_contact_flow(
    test_client: AsyncClient,
    sample_contact_data: dict,
    valid_api_key: str,
    mock_kafka_producer: AsyncMock,
    mock_telegram_bot,
):
    """
    Test the complete contact form submission flow.
    
    Flow:
    1. User submits contact form via API
    2. API validates data and checks rate limit
    3. Message is sent to Kafka
    4. Kafka consumer processes message (mocked)
    5. Telegram notification is sent (mocked)
    """
    # Setup mocks
    mock_kafka_producer.send_contact_message.return_value = True
    mock_telegram_bot.send_message = AsyncMock()
    
    # Submit contact form
    response = await test_client.post(
        "/api/public/contact",
        json=sample_contact_data,
        headers={"api-key": valid_api_key},
    )
    
    # Verify API response
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "queued"
    assert "id" in data
    
    # Verify Kafka producer was called
    mock_kafka_producer.send_contact_message.assert_called_once()
    
    # Get the message that was sent to Kafka
    sent_message = mock_kafka_producer.send_contact_message.call_args[0][0]
    
    # Verify message contents
    assert sent_message.name == sample_contact_data["name"]
    assert sent_message.message == sample_contact_data["message"]
    assert len(sent_message.channels) == len(sample_contact_data["channels"])


@pytest.mark.asyncio
async def test_contact_flow_with_multiple_channels(
    test_client: AsyncClient,
    valid_api_key: str,
    mock_kafka_producer: AsyncMock,
):
    """Test contact flow with multiple communication channels."""
    data = {
        "name": "Jane Doe",
        "message": "I want to discuss a project",
        "channels": ["telegram", "email", "phone"],
        "contacts": {
            "telegram": "@janedoe",
            "email": "jane@example.com",
            "phone": "+1234567890",
        },
    }
    
    mock_kafka_producer.send_contact_message.return_value = True
    
    response = await test_client.post(
        "/api/public/contact",
        json=data,
        headers={"api-key": valid_api_key},
    )
    
    assert response.status_code == 200
    
    # Verify all channels were included
    sent_message = mock_kafka_producer.send_contact_message.call_args[0][0]
    assert len(sent_message.channels) == 3


@pytest.mark.asyncio
async def test_contact_flow_rate_limiting_across_requests(
    test_client: AsyncClient,
    valid_api_key: str,
    mock_kafka_producer: AsyncMock,
    mock_rate_limiter,
):
    """Test that rate limiting works correctly across multiple requests."""
    data = {
        "name": "Test User",
        "message": "Test message",
        "channels": ["email"],
        "contacts": {"email": "test@example.com"},
    }
    
    # Make 3 successful requests
    for i in range(3):
        response = await test_client.post(
            "/api/public/contact",
            json=data,
            headers={"api-key": valid_api_key},
        )
        assert response.status_code == 200, f"Request {i+1} failed"
    
    # 4th request should be rate limited
    response = await test_client.post(
        "/api/public/contact",
        json=data,
        headers={"api-key": valid_api_key},
    )
    assert response.status_code == 429


@pytest.mark.asyncio
async def test_contact_flow_handles_kafka_failure_gracefully(
    test_client: AsyncClient,
    sample_contact_data: dict,
    valid_api_key: str,
    mock_kafka_producer: AsyncMock,
):
    """Test that Kafka failures are handled gracefully."""
    # Simulate Kafka failure
    mock_kafka_producer.send_contact_message.return_value = False
    
    response = await test_client.post(
        "/api/public/contact",
        json=sample_contact_data,
        headers={"api-key": valid_api_key},
    )
    
    assert response.status_code == 503
    data = response.json()
    assert "unavailable" in data["detail"].lower()


@pytest.mark.asyncio
async def test_health_checks_during_operation(test_client: AsyncClient):
    """Test that health checks work correctly during operation."""
    # Test basic health
    response = await test_client.get("/api/health")
    assert response.status_code == 200
    
    # Test liveness
    response = await test_client.get("/api/health/live")
    assert response.status_code == 200
    
    # Test readiness
    response = await test_client.get("/api/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert "checks" in data
    assert "redis" in data["checks"]
    assert "kafka" in data["checks"]
