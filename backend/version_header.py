"""API versioning middleware — adds X-API-Version header to all responses."""
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from version import VERSION


class VersionHeaderMiddleware(BaseHTTPMiddleware):
    """Adds X-API-Version header to every response."""

    def __init__(self, app, version: str = VERSION):
        super().__init__(app)
        self.version = version

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-API-Version"] = self.version
        return response
