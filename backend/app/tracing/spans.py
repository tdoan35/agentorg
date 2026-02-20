"""Lightweight tracing backend — logs to stdout, Datadog-ready interface."""
from __future__ import annotations

import logging
import time
import uuid
from contextlib import contextmanager
from typing import Any, Generator

logger = logging.getLogger(__name__)


class TracingBackend:
    """Minimal span-based tracing that logs to stdout.

    Can be swapped for a real Datadog/OpenTelemetry backend later.
    """

    @contextmanager
    def span(self, name: str, **tags: Any) -> Generator[dict, None, None]:
        span_id = str(uuid.uuid4())[:8]
        trace_ctx = {"span_id": span_id, "name": name, "tags": tags}
        start = time.monotonic()
        logger.info("[TRACE] START span=%s name=%s tags=%s", span_id, name, tags)
        try:
            yield trace_ctx
        except Exception as e:
            trace_ctx["error"] = str(e)
            logger.error("[TRACE] ERROR span=%s name=%s error=%s", span_id, name, e)
            raise
        finally:
            duration_ms = (time.monotonic() - start) * 1000
            trace_ctx["duration_ms"] = duration_ms
            logger.info(
                "[TRACE] END span=%s name=%s duration=%.1fms", span_id, name, duration_ms
            )


tracer = TracingBackend()
