"""FastAPI middleware that wraps each request in a trace span."""
from __future__ import annotations

import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.tracing.spans import tracer


class TracingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        trace_id = str(uuid.uuid4())
        request.state.trace_id = trace_id

        with tracer.span(
            "http_request",
            method=request.method,
            path=request.url.path,
            trace_id=trace_id,
        ):
            response = await call_next(request)
            response.headers["X-Trace-ID"] = trace_id
            return response
