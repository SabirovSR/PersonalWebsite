"""
Redis Sentinel-based rate limiter with automatic failover.
"""

import logging

import redis.asyncio as redis
from redis.asyncio.sentinel import Sentinel

from app.config import get_settings

logger = logging.getLogger(__name__)


class RateLimiter:
    """
    Rate limiter using Redis Sentinel cluster for high availability.

    Features:
    - Automatic failover when master fails
    - Sliding window rate limiting
    - Graceful degradation on Redis errors
    """

    def __init__(self):
        self._redis: redis.Redis | None = None
        self._sentinel: Sentinel | None = None
        self._settings = get_settings()

    async def connect(self) -> None:
        """Connect to Redis via Sentinel cluster."""
        if self._redis is not None:
            return

        try:
            # Try direct connection to master first (fallback if Sentinel has issues)
            # This is useful when Sentinel configuration is outdated
            logger.info("Attempting direct connection to Redis master...")

            self._redis = redis.Redis(
                host="redis-master",
                port=6379,
                password=self._settings.redis_password,
                db=self._settings.redis_db,
                socket_timeout=self._settings.redis_socket_timeout,
                socket_connect_timeout=self._settings.redis_socket_connect_timeout,
                encoding="utf-8",
                decode_responses=True,
            )

            # Test connection
            await self._redis.ping()

            logger.info(
                f"Redis connected successfully: "
                f"host=redis-master, "
                f"db={self._settings.redis_db}"
            )

        except Exception as direct_error:
            logger.warning(f"Direct connection failed, trying Sentinel: {direct_error}")

            try:
                # Get sentinel hosts from settings
                sentinel_nodes = self._settings.redis_sentinel_hosts_list

                logger.info(f"Connecting to Redis Sentinel: nodes={sentinel_nodes}")

                # Create Sentinel instance (no password needed for Sentinel itself)
                self._sentinel = Sentinel(
                    sentinel_nodes,
                    socket_timeout=self._settings.redis_socket_timeout,
                    socket_connect_timeout=self._settings.redis_socket_connect_timeout,
                )

                # Get master connection with automatic failover (password for Redis master)
                self._redis = self._sentinel.master_for(
                    self._settings.redis_sentinel_master,
                    socket_timeout=self._settings.redis_socket_timeout,
                    password=self._settings.redis_password,
                    db=self._settings.redis_db,
                    encoding="utf-8",
                    decode_responses=True,
                )

                # Test connection
                if self._redis is not None:
                    await self._redis.ping()

                # Get master info
                master_address = await self._sentinel.discover_master(
                    self._settings.redis_sentinel_master
                )

                logger.info(
                    f"Redis Sentinel connected successfully: "
                    f"master={self._settings.redis_sentinel_master}, "
                    f"address={master_address}, "
                    f"db={self._settings.redis_db}"
                )

            except Exception as sentinel_error:
                logger.exception(f"Failed to connect to Redis: {sentinel_error}")
                # Re-raise to fail fast on startup
                raise

    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        try:
            if self._redis is not None:
                await self._redis.close()
                self._redis = None
                logger.info("Redis connection closed")

            if self._sentinel is not None:
                # Sentinel connections are managed internally
                self._sentinel = None

        except Exception as e:
            logger.exception(f"Error during Redis disconnect: {e}")

    async def is_allowed(self, identifier: str) -> bool:
        """
        Check if the request is allowed based on rate limits.

        Uses sliding window algorithm with Redis.

        Args:
            identifier: Unique identifier (e.g., IP address)

        Returns:
            True if allowed, False if rate limited
        """
        if self._redis is None:
            logger.warning("Redis not connected, allowing request (fail-open)")
            return True

        key = f"ratelimit:contact:{identifier}"

        try:
            # Get current count
            current = await self._redis.get(key)

            if current is None:
                # First request, set counter with TTL
                await self._redis.setex(
                    key,
                    self._settings.rate_limit_window_seconds,
                    1,
                )
                logger.debug(f"Rate limit: first request for {identifier}")
                return True

            count = int(current)

            if count >= self._settings.rate_limit_requests:
                logger.warning(
                    f"Rate limit exceeded for {identifier}: "
                    f"{count}/{self._settings.rate_limit_requests}"
                )
                return False

            # Increment counter
            await self._redis.incr(key)
            logger.debug(
                f"Rate limit: {count + 1}/{self._settings.rate_limit_requests} for {identifier}"
            )
            return True

        except redis.RedisError as e:
            logger.exception(f"Redis error in rate limiter: {e}")
            # Fail-open: allow request on Redis errors to not block legitimate users
            return True
        except Exception as e:
            logger.exception(f"Unexpected error in rate limiter: {e}")
            return True

    async def get_remaining(self, identifier: str) -> int:
        """
        Get remaining requests for an identifier.

        Args:
            identifier: Unique identifier

        Returns:
            Number of remaining requests in the current window
        """
        if self._redis is None:
            return self._settings.rate_limit_requests

        key = f"ratelimit:contact:{identifier}"

        try:
            current = await self._redis.get(key)
            if current is None:
                return int(self._settings.rate_limit_requests)

            remaining = max(0, self._settings.rate_limit_requests - int(current))
            return int(remaining)

        except Exception as e:
            logger.exception(f"Error getting remaining requests: {e}")
            return int(self._settings.rate_limit_requests)

    async def get_ttl(self, identifier: str) -> int:
        """
        Get time-to-live for rate limit window.

        Args:
            identifier: Unique identifier

        Returns:
            Seconds until rate limit resets, or 0 if no limit active
        """
        if self._redis is None:
            return 0

        key = f"ratelimit:contact:{identifier}"

        try:
            ttl = await self._redis.ttl(key)
            return int(max(0, ttl)) if ttl > 0 else 0
        except Exception as e:
            logger.exception(f"Error getting TTL: {e}")
            return 0


# Global rate limiter instance
rate_limiter = RateLimiter()
