"""SSE event stream manager for real-time agent events."""
from __future__ import annotations

import asyncio
import json
import logging
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


class EventStreamManager:
    """Manages per-conversation async queues for SSE streaming."""

    def __init__(self) -> None:
        self._queues: dict[str, list[asyncio.Queue]] = {}

    def subscribe(self, conversation_id: str) -> asyncio.Queue:
        q: asyncio.Queue = asyncio.Queue()
        self._queues.setdefault(conversation_id, []).append(q)
        logger.debug("SSE subscriber added for conversation %s", conversation_id)
        return q

    def unsubscribe(self, conversation_id: str, queue: asyncio.Queue) -> None:
        if conversation_id in self._queues:
            self._queues[conversation_id] = [
                q for q in self._queues[conversation_id] if q is not queue
            ]
            if not self._queues[conversation_id]:
                del self._queues[conversation_id]

    async def emit(
        self,
        conversation_id: str,
        event_type: str,
        agent: str,
        *,
        target: str | None = None,
        message: str | None = None,
        approval_id: str | None = None,
        data: Any = None,
        trace_id: str | None = None,
    ) -> None:
        event = {
            "type": event_type,
            "agent": agent,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        if target:
            event["target"] = target
        if message:
            event["message"] = message
        if approval_id:
            event["approval_id"] = approval_id
        if data is not None:
            event["data"] = data
        if trace_id:
            event["trace_id"] = trace_id

        for q in self._queues.get(conversation_id, []):
            await q.put(event)

        logger.debug("Emitted %s for conversation %s", event_type, conversation_id)

    def emit_sync(self, conversation_id: str, event_type: str, agent: str, **kwargs) -> None:
        """Fire-and-forget emit from synchronous code (best-effort)."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                asyncio.ensure_future(
                    self.emit(conversation_id, event_type, agent, **kwargs)
                )
            else:
                loop.run_until_complete(
                    self.emit(conversation_id, event_type, agent, **kwargs)
                )
        except RuntimeError:
            logger.debug("No event loop for sync emit — skipping SSE event %s", event_type)


event_manager = EventStreamManager()
