"""Unit tests for limiter.py — rate limiter and get_client_ip."""
import pytest
from unittest.mock import MagicMock


class TestGetClientIp:
    def test_x_forwarded_for(self):
        from limiter import get_client_ip
        request = MagicMock()
        request.headers = {"x-forwarded-for": "1.2.3.4, 10.0.0.1, 10.0.0.2"}
        assert get_client_ip(request) == "1.2.3.4"

    def test_x_real_ip(self):
        from limiter import get_client_ip
        request = MagicMock()
        request.headers = {"x-real-ip": "5.6.7.8"}
        assert get_client_ip(request) == "5.6.7.8"

    def test_x_vercel_forwarded_for(self):
        from limiter import get_client_ip
        request = MagicMock()
        request.headers = {"x-vercel-forwarded-for": "9.10.11.12, proxy"}
        assert get_client_ip(request) == "9.10.11.12"

    def test_falls_back_to_remote_address(self):
        from limiter import get_client_ip
        request = MagicMock()
        request.headers = {}
        request.client.host = "10.0.0.1"
        assert get_client_ip(request) == "10.0.0.1"

    def test_empty_x_forwarded_for(self):
        from limiter import get_client_ip
        request = MagicMock()
        request.headers = {"x-forwarded-for": ""}
        request.client.host = "10.0.0.1"
        assert get_client_ip(request) == "10.0.0.1"

    def test_x_forwarded_for_priority_over_real_ip(self):
        from limiter import get_client_ip
        request = MagicMock()
        request.headers = {"x-forwarded-for": "1.2.3.4", "x-real-ip": "5.6.7.8"}
        assert get_client_ip(request) == "1.2.3.4"


class TestLimiterInstance:
    def test_limiter_exists(self):
        from limiter import limiter
        assert limiter is not None

    def test_limiter_has_key_func(self):
        from limiter import limiter
        assert limiter._key_func is not None
