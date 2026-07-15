"""Unit tests for security_headers.py — SecurityHeadersMiddleware."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class TestSecurityHeadersMiddleware:
    @pytest.mark.asyncio
    async def test_adds_security_headers(self):
        from security_headers import SecurityHeadersMiddleware
        middleware = SecurityHeadersMiddleware(MagicMock())
        mock_request = MagicMock()
        mock_response = MagicMock()
        mock_response.headers = {}

        async def call_next(request):
            return mock_response

        with patch("os.environ.get", return_value="development"):
            response = await middleware.dispatch(mock_request, call_next)
            assert response.headers["X-Content-Type-Options"] == "nosniff"
            assert response.headers["X-Frame-Options"] == "DENY"
            assert response.headers["X-XSS-Protection"] == "1; mode=block"
            assert response.headers["Referrer-Policy"] == "strict-origin-when-cross-origin"
            assert "Content-Security-Policy" in response.headers
            assert "Permissions-Policy" in response.headers

    @pytest.mark.asyncio
    async def test_hsts_in_production(self):
        from security_headers import SecurityHeadersMiddleware
        middleware = SecurityHeadersMiddleware(MagicMock())
        mock_request = MagicMock()
        mock_response = MagicMock()
        mock_response.headers = {}

        async def call_next(request):
            return mock_response

        with patch("os.environ.get", return_value="production"):
            response = await middleware.dispatch(mock_request, call_next)
            assert "Strict-Transport-Security" in response.headers
            assert "max-age=31536000" in response.headers["Strict-Transport-Security"]

    @pytest.mark.asyncio
    async def test_no_hsts_in_development(self):
        from security_headers import SecurityHeadersMiddleware
        middleware = SecurityHeadersMiddleware(MagicMock())
        mock_request = MagicMock()
        mock_response = MagicMock()
        mock_response.headers = {}

        async def call_next(request):
            return mock_response

        with patch("os.environ.get", return_value="development"):
            response = await middleware.dispatch(mock_request, call_next)
            assert "Strict-Transport-Security" not in response.headers

    @pytest.mark.asyncio
    async def test_csp_includes_stripe_and_google(self):
        from security_headers import SecurityHeadersMiddleware
        middleware = SecurityHeadersMiddleware(MagicMock())
        mock_request = MagicMock()
        mock_response = MagicMock()
        mock_response.headers = {}

        async def call_next(request):
            return mock_response

        with patch("os.environ.get", return_value="production"):
            response = await middleware.dispatch(mock_request, call_next)
            csp = response.headers["Content-Security-Policy"]
            assert "js.stripe.com" in csp
            assert "googleapis.com" in csp
            assert "a.run.app" in csp
