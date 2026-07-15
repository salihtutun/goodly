"""Unit tests for metrics.py — MetricsMiddleware."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class TestMetricsMiddleware:
    @pytest.mark.asyncio
    async def test_logs_request_metrics(self):
        from metrics import MetricsMiddleware
        middleware = MetricsMiddleware(MagicMock())
        mock_request = MagicMock()
        mock_request.url.path = "/api/health"
        mock_request.method = "GET"
        mock_request.headers = {}
        mock_request.state = MagicMock()
        del mock_request.state.limiter_info  # No rate limit info

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {}

        async def call_next(request):
            return mock_response

        with patch("metrics.request_id_var") as mock_var:
            mock_var.set = MagicMock()
            response = await middleware.dispatch(mock_request, call_next)
            assert response.status_code == 200
            assert "X-Request-ID" in response.headers

    @pytest.mark.asyncio
    async def test_adds_rate_limit_headers(self):
        from metrics import MetricsMiddleware
        middleware = MetricsMiddleware(MagicMock())
        mock_request = MagicMock()
        mock_request.url.path = "/api/audit"
        mock_request.method = "POST"
        mock_request.headers = {"X-Request-ID": "req-123"}
        mock_request.state.limiter_info = {"limit": "10", "remaining": "5", "reset": "60"}

        mock_response = MagicMock()
        mock_response.status_code = 201
        mock_response.headers = {}

        async def call_next(request):
            return mock_response

        with patch("metrics.request_id_var") as mock_var:
            mock_var.set = MagicMock()
            response = await middleware.dispatch(mock_request, call_next)
            assert response.headers["X-RateLimit-Limit"] == "10"
            assert response.headers["X-RateLimit-Remaining"] == "5"
            assert response.headers["X-RateLimit-Reset"] == "60"

    @pytest.mark.asyncio
    async def test_uses_header_request_id(self):
        from metrics import MetricsMiddleware
        middleware = MetricsMiddleware(MagicMock())
        mock_request = MagicMock()
        mock_request.url.path = "/api/test"
        mock_request.method = "GET"
        mock_request.headers = {"X-Request-ID": "custom-req-id"}
        mock_request.state = MagicMock()
        del mock_request.state.limiter_info

        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.headers = {}

        async def call_next(request):
            return mock_response

        with patch("metrics.request_id_var") as mock_var:
            mock_var.set = MagicMock()
            response = await middleware.dispatch(mock_request, call_next)
            mock_var.set.assert_called_once_with("custom-req-id")
