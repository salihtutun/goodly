"""Request metrics middleware for Goodly API.

Tracks request count, latency, and status codes.
Outputs structured JSON logs compatible with Cloud Monitoring.
"""
import time
import json
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("metrics")


class MetricsMiddleware(BaseHTTPMiddleware):
    """Logs request duration, path, method, and status for every request."""

    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration_ms = (time.time() - start) * 1000

        logger.info(json.dumps({
            "metric": "request",
            "path": request.url.path,
            "method": request.method,
            "status": response.status_code,
            "duration_ms": round(duration_ms, 2),
        }))

        return response
