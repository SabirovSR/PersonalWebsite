"""Tests for rate limiter service."""
import pytest
from redis.asyncio import Redis

from app.services.rate_limiter import RateLimiter


@pytest.mark.asyncio
async def test_rate_limiter_first_request(fake_redis: Redis):
    """Test that first request is always allowed."""
    rate_limiter = RateLimiter()
    rate_limiter._redis = fake_redis
    
    allowed = await rate_limiter.is_allowed("test-ip-1")
    
    assert allowed is True


@pytest.mark.asyncio
async def test_rate_limiter_within_limit(fake_redis: Redis):
    """Test requests within rate limit are allowed."""
    rate_limiter = RateLimiter()
    rate_limiter._redis = fake_redis
    
    # Make 3 requests (default limit)
    for _ in range(3):
        allowed = await rate_limiter.is_allowed("test-ip-2")
        assert allowed is True


@pytest.mark.asyncio
async def test_rate_limiter_exceeds_limit(fake_redis: Redis):
    """Test that requests exceeding limit are blocked."""
    rate_limiter = RateLimiter()
    rate_limiter._redis = fake_redis
    
    # Make 3 requests (default limit)
    for _ in range(3):
        await rate_limiter.is_allowed("test-ip-3")
    
    # 4th request should be blocked
    allowed = await rate_limiter.is_allowed("test-ip-3")
    assert allowed is False


@pytest.mark.asyncio
async def test_rate_limiter_get_remaining(fake_redis: Redis):
    """Test getting remaining requests."""
    rate_limiter = RateLimiter()
    rate_limiter._redis = fake_redis
    
    # Make 2 requests
    await rate_limiter.is_allowed("test-ip-4")
    await rate_limiter.is_allowed("test-ip-4")
    
    remaining = await rate_limiter.get_remaining("test-ip-4")
    assert remaining == 1  # 3 allowed - 2 used = 1 remaining


@pytest.mark.asyncio
async def test_rate_limiter_get_ttl(fake_redis: Redis):
    """Test getting TTL for rate limit window."""
    rate_limiter = RateLimiter()
    rate_limiter._redis = fake_redis
    
    # Make a request
    await rate_limiter.is_allowed("test-ip-5")
    
    ttl = await rate_limiter.get_ttl("test-ip-5")
    assert ttl > 0  # Should have a positive TTL


@pytest.mark.asyncio
async def test_rate_limiter_different_ips_independent(fake_redis: Redis):
    """Test that different IPs have independent rate limits."""
    rate_limiter = RateLimiter()
    rate_limiter._redis = fake_redis
    
    # Exhaust limit for IP 1
    for _ in range(3):
        await rate_limiter.is_allowed("test-ip-6")
    
    # IP 2 should still be allowed
    allowed = await rate_limiter.is_allowed("test-ip-7")
    assert allowed is True


@pytest.mark.asyncio
async def test_rate_limiter_fail_open_on_error():
    """Test fail-open behavior when Redis is unavailable."""
    rate_limiter = RateLimiter()
    # Don't set _redis, simulating connection failure
    
    allowed = await rate_limiter.is_allowed("test-ip-8")
    
    # Should allow request when Redis is unavailable (fail-open)
    assert allowed is True


@pytest.mark.asyncio
async def test_rate_limiter_get_remaining_no_requests(fake_redis: Redis):
    """Test get_remaining for identifier with no requests yet."""
    rate_limiter = RateLimiter()
    rate_limiter._redis = fake_redis
    
    remaining = await rate_limiter.get_remaining("test-ip-9")
    
    # Should return full limit
    assert remaining == rate_limiter._settings.rate_limit_requests
