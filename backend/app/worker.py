"""
Kafka worker entry point.
Run with: python -m app.worker
"""
import asyncio
import logging
import signal
from typing import Optional

from app.kafka.consumer import KafkaConsumerService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Global consumer reference for signal handling
consumer: Optional[KafkaConsumerService] = None


async def shutdown(sig: signal.Signals) -> None:
    """Handle shutdown signals gracefully."""
    logger.info(f"Received signal {sig.name}, shutting down...")
    
    if consumer:
        await consumer.stop()


async def main() -> None:
    """Main entry point for the worker."""
    global consumer
    
    logger.info("Starting Kafka worker...")
    
    # Set up signal handlers
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(
            sig,
            lambda s=sig: asyncio.create_task(shutdown(s)),
        )
    
    # Create and start consumer
    consumer = KafkaConsumerService()
    
    try:
        await consumer.start()
        await consumer.run()
    except Exception as e:
        logger.exception(f"Worker error: {e}")
    finally:
        await consumer.stop()
        logger.info("Worker stopped")


if __name__ == "__main__":
    asyncio.run(main())
