"""
Structured logging configuration for production-ready applications.
"""

import json
import logging
import sys
from datetime import UTC, datetime
from typing import Any


class JSONFormatter(logging.Formatter):
    """
    JSON formatter for structured logging.

    Outputs logs in JSON format for easy parsing by log aggregation tools
    like Loki, ELK, or CloudWatch.
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format log record as JSON."""
        log_data: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add request ID if present (for request tracing)
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id

        # Add extra fields
        if hasattr(record, "extra"):
            log_data["extra"] = record.extra

        return json.dumps(log_data, ensure_ascii=False)


def setup_logging(debug: bool = False) -> None:
    """
    Configure structured logging for the application.

    Args:
        debug: If True, use human-readable format. If False, use JSON format.
    """
    level = logging.DEBUG if debug else logging.INFO

    # Create handler
    handler = logging.StreamHandler(sys.stdout)

    if debug:
        # Human-readable format for development
        formatter = logging.Formatter(
            fmt="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    else:
        # JSON format for production (better for log aggregation)
        formatter = JSONFormatter()

    handler.setFormatter(formatter)

    # Configure root logger
    logging.basicConfig(
        level=level,
        handlers=[handler],
        force=True,  # Override any existing configuration
    )

    # Reduce noise from verbose libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("aiokafka").setLevel(logging.WARNING)
    logging.getLogger("aiokafka.conn").setLevel(logging.ERROR)
    logging.getLogger("aiogram").setLevel(logging.INFO)

    logger = logging.getLogger(__name__)
    logger.info(
        f"Logging configured: level={logging.getLevelName(level)}, "
        f"format={'human-readable' if debug else 'JSON'}"
    )
