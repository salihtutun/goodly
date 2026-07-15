"""Unit tests for version.py and version_header.py."""
import pytest
from unittest.mock import MagicMock, patch


class TestVersion:
    def test_version_is_string(self):
        from version import VERSION
        assert isinstance(VERSION, str)
        assert len(VERSION) > 0

    def test_version_format(self):
        from version import VERSION
        parts = VERSION.split(".")
        assert len(parts) == 3
        assert all(p.isdigit() for p in parts)


class TestVersionHeaderMiddleware:
    @pytest.mark.asyncio
    async def test_adds_version_header(self):
        from version_header import VersionHeaderMiddleware
        middleware = VersionHeaderMiddleware(MagicMock(), version="2.0.0")
        mock_request = MagicMock()
        mock_response = MagicMock()
        mock_response.headers = {}

        async def call_next(request):
            return mock_response

        response = await middleware.dispatch(mock_request, call_next)
        assert response.headers["X-API-Version"] == "2.0.0"

    @pytest.mark.asyncio
    async def test_default_version(self):
        from version_header import VersionHeaderMiddleware
        from version import VERSION
        middleware = VersionHeaderMiddleware(MagicMock())
        assert middleware.version == VERSION
