"""Request metrics middleware for Goodly API.

Tracks request count, latency, and status codes.
Outputs structured JSON logs compatible with Cloud Monitoring.
"""
import time
import json
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from logging_config import request_id_var, get_request_id

logger = logging.getLogger("metrics")


class MetricsMiddleware(BaseHTTPMiddleware):
    """Logs request duration, path, method, and status for every request."""

    async def dispatch(self, request: Request, call_next):
        # Set request ID for log correlation
        rid = request.headers.get("X-Request-ID") or get_request_id()
        request_id_var.set(rid)

        start = time.time()
        response = await call_next(request)
        duration_ms = (time.time() - start) * 1000

        # Add request ID to response headers
        response.headers["X-Request-ID"] = rid

        # Add rate limit headers if available
        if hasattr(request.state, "limiter_info"):
            info = request.state.limiter_info
            response.headers["X-RateLimit-Limit"] = str(info.get("limit", ""))
            response.headers["X-RateLimit-Remaining"] = str(info.get("remaining", ""))
            response.headers["X-RateLimit-Reset"] = str(info.get("reset", ""))

        logger.info(json.dumps({
            "metric": "request",
            "path": request.url.path,
            "method": request.method,
            "status": response.status_code,
            "duration_ms": round(duration_ms, 2),
        }))

        return response
