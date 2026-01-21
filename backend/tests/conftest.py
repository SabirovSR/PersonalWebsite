"""
Pytest fixtures for tests.
"""
import os
from typing import AsyncGenerator, Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fakeredis import aioredis as fakeredis
from httpx import AsyncClient
from redis.asyncio import Redis

from app.config import Settings, get_settings
from app.main import create_app
from app.services.kafka_producer import KafkaProducerService
from app.services.rate_limiter import RateLimiter


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    """Get test settings."""
    os.environ["DEBUG"] = "true"
    os.environ["PUBLIC_API_KEY"] = "test-api-key"
    os.environ["TELEGRAM_BOT_TOKEN"] = "test-bot-token"
    os.environ["TELEGRAM_OWNER_ID"] = "123456789"
    os.environ["REDIS_SENTINEL_HOSTS"] = "localhost:26379"
    os.environ["KAFKA_BOOTSTRAP_SERVERS"] = "localhost:9092"
    
    return get_settings()


@pytest.fixture
async def fake_redis() -> AsyncGenerator[Redis, None]:
    """Create a fake Redis client for testing."""
    redis_client = fakeredis.FakeRedis(decode_responses=True)
    yield redis_client
    await redis_client.flushall()
    await redis_client.aclose()


@pytest.fixture
async def mock_rate_limiter(fake_redis: Redis) -> AsyncGenerator[RateLimiter, None]:
    """Create a rate limiter with fake Redis."""
    rate_limiter = RateLimiter()
    rate_limiter._redis = fake_redis
    yield rate_limiter


@pytest.fixture
def mock_kafka_producer() -> Generator[AsyncMock, None, None]:
    """Mock Kafka producer."""
    mock_producer = AsyncMock(spec=KafkaProducerService)
    mock_producer.send_contact_message.return_value = True
    
    with patch("app.services.kafka_producer.kafka_producer", mock_producer):
        yield mock_producer


@pytest.fixture
def mock_telegram_bot() -> Generator[MagicMock, None, None]:
    """Mock Telegram bot."""
    with patch("app.telegram.bot.bot") as mock_bot:
        mock_bot.send_message = AsyncMock()
        yield mock_bot


@pytest.fixture
async def test_client(
    test_settings: Settings,
    mock_kafka_producer: AsyncMock,
    mock_rate_limiter: RateLimiter,
) -> AsyncGenerator[AsyncClient, None]:
    """
    Create a test client for the FastAPI app.
    
    This fixture creates an app with mocked external services.
    """
    # Patch services before creating the app
    with patch("app.services.kafka_producer.kafka_producer", mock_kafka_producer):
        with patch("app.services.rate_limiter.rate_limiter", mock_rate_limiter):
            with patch("app.telegram.bot.setup_webhook", AsyncMock()):
                with patch("app.telegram.bot.shutdown_webhook", AsyncMock()):
                    app = create_app()
                    
                    async with AsyncClient(app=app, base_url="http://test") as client:
                        yield client


@pytest.fixture
def sample_contact_data() -> dict:
    """Sample contact form data."""
    return {
        "name": "John Doe",
        "message": "Hello! I would like to discuss a project.",
        "channels": ["telegram", "email"],
        "contacts": {
            "telegram": "@johndoe",
            "email": "john@example.com",
        },
    }


@pytest.fixture
def valid_api_key(test_settings: Settings) -> str:
    """Get valid API key for tests."""
    return test_settings.public_api_key
