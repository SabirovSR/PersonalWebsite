"""
Redis-based service for owner status management.
"""

import json
import logging
from datetime import datetime

import redis.asyncio as redis
from redis.asyncio.sentinel import Sentinel

from app.config import get_settings

logger = logging.getLogger(__name__)

STATUSES: dict[str, dict] = {
    "online":   {"emoji": "🟢", "label_ru": "Онлайн",  "label_en": "Online",   "color": "#00ff88"},
    "away":     {"emoji": "🟡", "label_ru": "Отошёл",  "label_en": "Away",     "color": "#f59e0b"},
    "busy":     {"emoji": "🔴", "label_ru": "Занят",   "label_en": "Busy",     "color": "#ef4444"},
    "working":  {"emoji": "💼", "label_ru": "Работаю", "label_en": "Working",  "color": "#3b82f6"},
    "studying": {"emoji": "📚", "label_ru": "Учусь",   "label_en": "Studying", "color": "#8b5cf6"},
    "gaming":   {"emoji": "🎮", "label_ru": "Играю",   "label_en": "Gaming",   "color": "#f97316"},
    "offline":  {"emoji": "⚫", "label_ru": "Офлайн",  "label_en": "Offline",  "color": "#6b7280"},
}

DEFAULT_STATUS = "online"
STATUS_KEY = "owner:status"
PUBSUB_CHANNEL = "owner:status:updates"
BLOG_PUBSUB_CHANNEL = "blog:updates"


class StatusService:
    """Service for managing owner status in Redis."""

    def __init__(self):
        self._redis: redis.Redis | None = None
        self._settings = get_settings()

    async def create_pubsub_connection(self) -> redis.Redis:
        """Create a dedicated Redis connection for pub/sub use.

        Uses socket_timeout=None so the pub/sub listener can wait indefinitely
        for messages without the socket timing out between status changes.
        The caller is responsible for closing the connection.
        """
        settings = self._settings
        try:
            r = redis.Redis(
                host="redis-master",
                port=6379,
                password=settings.redis_password,
                db=settings.redis_db,
                socket_timeout=None,  # no timeout — pub/sub waits indefinitely
                socket_connect_timeout=settings.redis_socket_connect_timeout,
                encoding="utf-8",
                decode_responses=True,
            )
            await r.ping()
            return r
        except Exception:
            sentinel_pass = (
                settings.redis_sentinel_password or settings.redis_password
            )
            sentinel_kwargs = {
                "socket_timeout": None,
                "socket_connect_timeout": settings.redis_socket_connect_timeout,
            }
            if sentinel_pass:
                sentinel_kwargs["password"] = sentinel_pass
            sentinel = Sentinel(
                settings.redis_sentinel_hosts_list,
                sentinel_kwargs=sentinel_kwargs,
                socket_timeout=None,  # no timeout — pub/sub waits indefinitely
                socket_connect_timeout=settings.redis_socket_connect_timeout,
            )
            r = sentinel.master_for(
                settings.redis_sentinel_master,
                socket_timeout=None,
                password=settings.redis_password,
                db=settings.redis_db,
                encoding="utf-8",
                decode_responses=True,
            )
            await r.ping()
            return r

    async def connect(self) -> None:
        """Connect to Redis (direct first, then Sentinel fallback)."""
        if self._redis is not None:
            return

        try:
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
            await self._redis.ping()
            logger.info("StatusService: Redis connected (direct)")
        except Exception as direct_error:
            logger.warning(f"StatusService: Direct Redis failed, trying Sentinel: {direct_error}")
            try:
                sentinel_pass = (
                    self._settings.redis_sentinel_password
                    or self._settings.redis_password
                )
                sentinel_kwargs = {
                    "socket_timeout": self._settings.redis_socket_timeout,
                    "socket_connect_timeout": self._settings.redis_socket_connect_timeout,
                }
                if sentinel_pass:
                    sentinel_kwargs["password"] = sentinel_pass
                sentinel = Sentinel(
                    self._settings.redis_sentinel_hosts_list,
                    sentinel_kwargs=sentinel_kwargs,
                    socket_timeout=self._settings.redis_socket_timeout,
                    socket_connect_timeout=self._settings.redis_socket_connect_timeout,
                )
                self._redis = sentinel.master_for(
                    self._settings.redis_sentinel_master,
                    socket_timeout=self._settings.redis_socket_timeout,
                    password=self._settings.redis_password,
                    db=self._settings.redis_db,
                    encoding="utf-8",
                    decode_responses=True,
                )
                await self._redis.ping()
                logger.info("StatusService: Redis Sentinel connected")
            except Exception as e:
                logger.warning(f"StatusService: Redis unavailable (using default status): {e}")
                self._redis = None

    async def disconnect(self) -> None:
        """Disconnect from Redis."""
        if self._redis is not None:
            try:
                await self._redis.close()
            except Exception:
                pass
            self._redis = None

    async def get_status(self) -> dict:
        """Return current owner status. Falls back to default if Redis unavailable."""
        if self._redis is None:
            return self._build_status(DEFAULT_STATUS)

        try:
            raw = await self._redis.get(STATUS_KEY)
            if raw is None:
                return self._build_status(DEFAULT_STATUS)
            parsed = json.loads(raw)
            code = parsed.get("code", DEFAULT_STATUS)
            if code not in STATUSES:
                code = DEFAULT_STATUS
            return self._build_status(code, parsed.get("updated_at"))
        except Exception as e:
            logger.exception(f"StatusService: Error getting status: {e}")
            return self._build_status(DEFAULT_STATUS)

    async def set_status(self, code: str) -> dict:
        """Persist a new status code to Redis and broadcast via pub/sub."""
        if code not in STATUSES:
            raise ValueError(f"Unknown status code: {code!r}")

        updated_at = datetime.utcnow().isoformat()
        payload = json.dumps({"code": code, "updated_at": updated_at})

        if self._redis is not None:
            try:
                await self._redis.set(STATUS_KEY, payload)
                await self._redis.publish(PUBSUB_CHANNEL, json.dumps(self._build_status(code, updated_at)))
            except Exception as e:
                logger.exception(f"StatusService: Error setting status: {e}")

        return self._build_status(code, updated_at)

    @staticmethod
    def _build_status(code: str, updated_at: str | None = None) -> dict:
        info = STATUSES.get(code, STATUSES[DEFAULT_STATUS])
        return {
            "code": code,
            "emoji": info["emoji"],
            "label_ru": info["label_ru"],
            "label_en": info["label_en"],
            "color": info["color"],
            "updated_at": updated_at,
        }


# Global singleton
status_service = StatusService()
