"""
Contact form API endpoint.
"""

import logging
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.config import get_settings
from app.models import ContactFormRequest, ContactMessage, ContactResponse
from app.services.kafka_producer import kafka_producer
from app.services.rate_limiter import rate_limiter

logger = logging.getLogger(__name__)
router = APIRouter()


def get_client_ip(request: Request) -> str:
    """Extract client IP from request, considering proxies."""
    # Check X-Forwarded-For header (set by Traefik/nginx)
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # Take the first IP (original client)
        return forwarded.split(",")[0].strip()

    # Check X-Real-IP header
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip

    # Fallback to direct client
    if request.client:
        return request.client.host

    return "unknown"


@router.post("/contact", response_model=ContactResponse)
async def submit_contact(
    request: Request,
    form: ContactFormRequest,
    api_key: Annotated[str, Header(alias="api-key")],
):
    """
    Submit a contact form request.

    This endpoint accepts contact form submissions and queues them
    for processing via Kafka.
    """
    settings = get_settings()

    # Validate API key
    if api_key != settings.public_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )

    # Get client IP for rate limiting
    client_ip = get_client_ip(request)

    # Check rate limit
    if not await rate_limiter.is_allowed(client_ip):
        remaining = await rate_limiter.get_remaining(client_ip)
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Rate limit exceeded. Try again later. Remaining: {remaining}",
            headers={"Retry-After": str(settings.rate_limit_window_seconds)},
        )

    # Validate that at least one contact method is provided for selected channels
    for channel in form.channels:
        contact_value = getattr(form.contacts, channel.value, None)
        if not contact_value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Contact information required for channel: {channel.value}",
            )

    # Create message for Kafka
    message = ContactMessage(
        name=form.name,
        message=form.message,
        channels=form.channels,
        contacts=form.contacts,
        ip_address=client_ip,
        user_agent=request.headers.get("user-agent"),
    )

    # Send to Kafka
    success = await kafka_producer.send_contact_message(message)

    if not success:
        logger.error(f"Failed to queue contact message: {message.id}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Service temporarily unavailable. Please try again later.",
        )

    logger.info(f"Contact form submitted: {message.id} from {client_ip}")

    return ContactResponse(
        status="queued",
        message="Your message has been received. We will contact you soon!",
        id=message.id,
    )
