"""
Health check endpoints for Kubernetes-style probes.

Implements three types of health checks:
- Basic health: Simple "is the app running?" check
- Liveness: Is the application alive and responsive?
- Readiness: Are all dependencies (Redis, Kafka) ready?
"""

import logging
from typing import Any

from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.services.kafka_producer import kafka_producer
from app.services.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health", status_code=status.HTTP_200_OK)
async def health_check() -> dict[str, str]:
    """
    Basic health check endpoint.

    Returns 200 if the application is running.
    Used by load balancers for basic health monitoring.
    """
    return {"status": "healthy"}


@router.get("/health/live", status_code=status.HTTP_200_OK)
async def liveness_check() -> dict[str, str]:
    """
    Liveness probe - is the application alive?

    This endpoint should always return 200 if the app is running.
    Used by Kubernetes/Docker to detect if the container needs restart.
    """
    return {"status": "alive"}


@router.get("/health/ready", status_code=status.HTTP_200_OK)
async def readiness_check() -> JSONResponse:
    """
    Readiness probe - is the application ready to serve traffic?

    Checks if all critical dependencies are available:
    - Redis Sentinel connection
    - Kafka connection

    Returns:
        200 if ready, 503 if not ready
    """
    settings = get_settings()

    checks: dict[str, Any] = {
        "redis": {"status": "unknown", "details": None},
        "kafka": {"status": "unknown", "details": None},
    }

    # Check Redis Sentinel
    try:
        if rate_limiter._redis is not None:
            # Ping Redis
            await rate_limiter._redis.ping()

            # Get master info from Sentinel
            if rate_limiter._sentinel is not None:
                master_address = await rate_limiter._sentinel.discover_master(
                    settings.redis_sentinel_master
                )
                checks["redis"]["status"] = "healthy"
                checks["redis"]["details"] = {
                    "master": settings.redis_sentinel_master,
                    "address": f"{master_address[0]}:{master_address[1]}",
                }
            else:
                checks["redis"]["status"] = "healthy"
                checks["redis"]["details"] = "connected"
        else:
            checks["redis"]["status"] = "not_connected"
            checks["redis"]["details"] = "Redis client not initialized"
    except Exception as e:
        checks["redis"]["status"] = "unhealthy"
        checks["redis"]["details"] = str(e)
        logger.error(f"Redis health check failed: {e}")

    # Check Kafka
    try:
        if kafka_producer._producer is not None:
            # Kafka producer is connected
            checks["kafka"]["status"] = "healthy"
            checks["kafka"]["details"] = {
                "bootstrap_servers": settings.kafka_bootstrap_servers,
                "topic": settings.kafka_topic,
            }
        else:
            checks["kafka"]["status"] = "not_connected"
            checks["kafka"]["details"] = "Kafka producer not initialized"
    except Exception as e:
        checks["kafka"]["status"] = "unhealthy"
        checks["kafka"]["details"] = str(e)
        logger.error(f"Kafka health check failed: {e}")

    # Determine overall readiness
    all_healthy = all(check["status"] == "healthy" for check in checks.values())

    response_status = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE

    return JSONResponse(
        status_code=response_status,
        content={
            "status": "ready" if all_healthy else "not_ready",
            "checks": checks,
            "environment": settings.environment,
        },
    )


@router.get("/health/startup", status_code=status.HTTP_200_OK)
async def startup_check() -> JSONResponse:
    """
    Startup probe - has the application completed initialization?

    Similar to readiness but used during container startup.
    """
    return await readiness_check()
