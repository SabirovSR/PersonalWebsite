"""
FastAPI application entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api import api_router
from app.config import get_settings
from app.services.kafka_producer import kafka_producer
from app.services.rate_limiter import rate_limiter
from app.telegram.bot import setup_webhook, shutdown_webhook

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager."""
    settings = get_settings()

    # Startup
    logger.info("Starting application...")

    # Connect services
    await rate_limiter.connect()
    await kafka_producer.start()

    # Setup Telegram webhook if configured
    if settings.telegram_bot_token and settings.telegram_webhook_url:
        await setup_webhook()

    logger.info("Application started successfully")

    yield

    # Shutdown
    logger.info("Shutting down application...")

    await shutdown_webhook()
    await kafka_producer.stop()
    await rate_limiter.disconnect()

    logger.info("Application shut down successfully")


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    settings = get_settings()

    # Initialize logging
    from app.logging_config import setup_logging

    setup_logging(debug=settings.debug)

    app = FastAPI(
        title=settings.app_name,
        description="Production-ready API with Kafka/Redis Sentinel infrastructure",
        version="2.0.0",
        lifespan=lifespan,
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
    )

    # Security headers middleware
    @app.middleware("http")
    async def add_security_headers(request: Request, call_next):
        """Add security headers to all responses."""
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

        # HSTS only for HTTPS
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"

        return response

    # CORS middleware with environment-based origins
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=settings.cors_allow_credentials,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
        max_age=settings.cors_max_age,
    )

    # Include API routes
    app.include_router(api_router, prefix="/api")

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
