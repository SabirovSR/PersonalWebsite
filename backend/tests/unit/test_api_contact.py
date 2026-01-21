"""Tests for contact form API endpoint."""
from unittest.mock import AsyncMock

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_submit_contact_success(
    test_client: AsyncClient,
    sample_contact_data: dict,
    valid_api_key: str,
    mock_kafka_producer: AsyncMock,
):
    """Test successful contact form submission."""
    mock_kafka_producer.send_contact_message.return_value = True
    
    response = await test_client.post(
        "/api/public/contact",
        json=sample_contact_data,
        headers={"api-key": valid_api_key},
    )
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["status"] == "queued"
    assert "message" in data
    assert "id" in data
    
    # Verify Kafka producer was called
    mock_kafka_producer.send_contact_message.assert_called_once()


@pytest.mark.asyncio
async def test_submit_contact_invalid_api_key(
    test_client: AsyncClient,
    sample_contact_data: dict,
):
    """Test contact submission with invalid API key."""
    response = await test_client.post(
        "/api/public/contact",
        json=sample_contact_data,
        headers={"api-key": "invalid-key"},
    )
    
    assert response.status_code == 401
    assert "detail" in response.json()


@pytest.mark.asyncio
async def test_submit_contact_missing_api_key(
    test_client: AsyncClient,
    sample_contact_data: dict,
):
    """Test contact submission without API key."""
    response = await test_client.post(
        "/api/public/contact",
        json=sample_contact_data,
    )
    
    assert response.status_code == 422  # Validation error


@pytest.mark.asyncio
async def test_submit_contact_missing_name(
    test_client: AsyncClient,
    valid_api_key: str,
):
    """Test contact submission with missing name."""
    data = {
        "message": "Test message",
        "channels": ["email"],
        "contacts": {"email": "test@example.com"},
    }
    
    response = await test_client.post(
        "/api/public/contact",
        json=data,
        headers={"api-key": valid_api_key},
    )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_contact_missing_message(
    test_client: AsyncClient,
    valid_api_key: str,
):
    """Test contact submission with missing message."""
    data = {
        "name": "John Doe",
        "channels": ["email"],
        "contacts": {"email": "test@example.com"},
    }
    
    response = await test_client.post(
        "/api/public/contact",
        json=data,
        headers={"api-key": valid_api_key},
    )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_contact_invalid_channel(
    test_client: AsyncClient,
    valid_api_key: str,
):
    """Test contact submission with invalid channel."""
    data = {
        "name": "John Doe",
        "message": "Test message",
        "channels": ["invalid_channel"],
        "contacts": {"telegram": "@test"},
    }
    
    response = await test_client.post(
        "/api/public/contact",
        json=data,
        headers={"api-key": valid_api_key},
    )
    
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_submit_contact_missing_contact_info(
    test_client: AsyncClient,
    valid_api_key: str,
):
    """Test contact submission with missing contact info for selected channel."""
    data = {
        "name": "John Doe",
        "message": "Test message",
        "channels": ["telegram", "email"],
        "contacts": {"telegram": "@test"},  # Missing email
    }
    
    response = await test_client.post(
        "/api/public/contact",
        json=data,
        headers={"api-key": valid_api_key},
    )
    
    assert response.status_code == 400
    assert "email" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_submit_contact_kafka_failure(
    test_client: AsyncClient,
    sample_contact_data: dict,
    valid_api_key: str,
    mock_kafka_producer: AsyncMock,
):
    """Test contact submission when Kafka fails."""
    mock_kafka_producer.send_contact_message.return_value = False
    
    response = await test_client.post(
        "/api/public/contact",
        json=sample_contact_data,
        headers={"api-key": valid_api_key},
    )
    
    assert response.status_code == 503
    assert "unavailable" in response.json()["detail"].lower()


@pytest.mark.asyncio
async def test_submit_contact_rate_limit(
    test_client: AsyncClient,
    sample_contact_data: dict,
    valid_api_key: str,
    mock_rate_limiter,
):
    """Test rate limiting on contact endpoint."""
    # Submit requests until rate limit is hit
    for i in range(3):
        response = await test_client.post(
            "/api/public/contact",
            json=sample_contact_data,
            headers={"api-key": valid_api_key},
        )
        assert response.status_code == 200
    
    # Next request should be rate limited
    response = await test_client.post(
        "/api/public/contact",
        json=sample_contact_data,
        headers={"api-key": valid_api_key},
    )
    
    assert response.status_code == 429
    assert "rate limit" in response.json()["detail"].lower()
