"""
WebSocket endpoints for real-time status and blog updates via Redis pub/sub.
"""

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.status_service import BLOG_PUBSUB_CHANNEL, PUBSUB_CHANNEL, status_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/status")
async def status_websocket(websocket: WebSocket):
    """
    Stream owner status updates to connected browser clients.

    - Sends current status immediately on connection.
    - Pushes updates in real-time via Redis pub/sub whenever the bot changes status.
    - Sends a ping frame every 25 s to keep the connection alive through proxies.
    """
    await websocket.accept()
    logger.info("WebSocket client connected for status updates")

    # Dedicated Redis connection for pub/sub (cannot reuse the shared connection)
    r = None
    pubsub = None
    reader_task = None
    queue: asyncio.Queue = asyncio.Queue(maxsize=32)

    try:
        r = await status_service.create_pubsub_connection()
        pubsub = r.pubsub()
        await pubsub.subscribe(PUBSUB_CHANNEL)

        # Send current status immediately so the client doesn't need an extra HTTP call
        current = await status_service.get_status()
        await websocket.send_json(current)

        async def _pubsub_reader() -> None:
            """Read Redis pub/sub messages and forward to the local queue."""
            try:
                async for message in pubsub.listen():
                    if message and message.get("type") == "message":
                        try:
                            data = json.loads(message["data"])
                            await queue.put(data)
                        except (json.JSONDecodeError, asyncio.QueueFull):
                            pass
            except asyncio.CancelledError:
                pass
            except Exception as exc:
                logger.warning(f"PubSub reader error: {exc}")

        reader_task = asyncio.create_task(_pubsub_reader())

        while True:
            try:
                update = await asyncio.wait_for(queue.get(), timeout=25.0)
                await websocket.send_json(update)
            except asyncio.TimeoutError:
                # Heartbeat — keeps connection alive through load balancers/proxies
                await websocket.send_json({"ping": True})

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as exc:
        logger.warning(f"WebSocket error: {exc}")
    finally:
        if reader_task is not None:
            reader_task.cancel()
            try:
                await reader_task
            except asyncio.CancelledError:
                pass
        if pubsub is not None:
            try:
                await pubsub.unsubscribe(PUBSUB_CHANNEL)
                await pubsub.aclose()
            except Exception:
                pass
        if r is not None:
            try:
                await r.aclose()
            except Exception:
                pass


def _serialize_post(post) -> dict:
    """Serialize a BlogPost ORM object to a JSON-safe dict."""
    return {
        "id": str(post.id),
        "title": post.title,
        "content": post.content,
        "slug": post.slug,
        "published": post.published,
        "created_at": post.created_at.isoformat(),
        "updated_at": post.updated_at.isoformat(),
    }


@router.websocket("/ws/blog")
async def blog_websocket(websocket: WebSocket):
    """
    Stream blog post updates to connected browser clients.

    - Sends current published posts as a snapshot on connection.
    - Pushes updates in real-time via Redis pub/sub whenever the bot creates/updates/deletes posts.
    - Sends a ping frame every 25 s to keep the connection alive through proxies.
    """
    await websocket.accept()
    logger.info("WebSocket client connected for blog updates")

    r = None
    pubsub = None
    reader_task = None
    queue: asyncio.Queue = asyncio.Queue(maxsize=64)

    try:
        r = await status_service.create_pubsub_connection()
        pubsub = r.pubsub()
        await pubsub.subscribe(BLOG_PUBSUB_CHANNEL)

        # Send current published posts as a snapshot so the client
        # doesn't need a separate HTTP call for initial state.
        from app.database.service import DatabaseService
        db = DatabaseService()
        try:
            await db.connect()
            posts = await db.list_published_blog_posts()
            snapshot = {
                "action": "snapshot",
                "posts": [_serialize_post(p) for p in posts],
            }
        except Exception as exc:
            logger.warning(f"Failed to fetch initial blog posts for WS: {exc}")
            snapshot = {"action": "snapshot", "posts": []}
        finally:
            await db.disconnect()

        await websocket.send_json(snapshot)

        async def _pubsub_reader() -> None:
            """Read Redis pub/sub messages and forward to the local queue."""
            try:
                async for message in pubsub.listen():
                    if message and message.get("type") == "message":
                        try:
                            data = json.loads(message["data"])
                            await queue.put(data)
                        except (json.JSONDecodeError, asyncio.QueueFull):
                            pass
            except asyncio.CancelledError:
                pass
            except Exception as exc:
                logger.warning(f"Blog PubSub reader error: {exc}")

        reader_task = asyncio.create_task(_pubsub_reader())

        while True:
            try:
                update = await asyncio.wait_for(queue.get(), timeout=25.0)
                await websocket.send_json(update)
            except asyncio.TimeoutError:
                await websocket.send_json({"ping": True})

    except WebSocketDisconnect:
        logger.info("Blog WebSocket client disconnected")
    except Exception as exc:
        logger.warning(f"Blog WebSocket error: {exc}")
    finally:
        if reader_task is not None:
            reader_task.cancel()
            try:
                await reader_task
            except asyncio.CancelledError:
                pass
        if pubsub is not None:
            try:
                await pubsub.unsubscribe(BLOG_PUBSUB_CHANNEL)
                await pubsub.aclose()
            except Exception:
                pass
        if r is not None:
            try:
                await r.aclose()
            except Exception:
                pass
