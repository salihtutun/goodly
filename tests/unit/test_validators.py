"""Unit tests for validators.py — URL, email, domain validation, SSRF guard, truncate."""
import pytest
from unittest.mock import patch
from validators import validate_url, is_public_url, validate_email, validate_domain, truncate


class TestValidateUrl:
    def test_valid_https_url(self):
        assert validate_url("https://example.com") is True

    def test_valid_http_url(self):
        assert validate_url("http://example.com/page") is True

    def test_url_without_protocol(self):
        assert validate_url("example.com") is True

    def test_empty_url(self):
        assert validate_url("") is False

    def test_whitespace_only(self):
        assert validate_url("   ") is False

    def test_none_url(self):
        assert validate_url(None) is False

    def test_no_dot_in_host(self):
        assert validate_url("https://localhost") is False

    def test_url_too_long(self):
        assert validate_url("https://example.com/" + "a" * 2048) is False

    def test_url_with_path_and_query(self):
        assert validate_url("https://example.com/path?query=1") is True


class TestIsPublicUrl:
    def test_valid_public_url(self):
        with patch("socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(2, 1, 6, "", ("93.184.216.34", 0))]
            assert is_public_url("https://example.com") is True

    def test_private_ip_blocked(self):
        with patch("socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(2, 1, 6, "", ("192.168.1.1", 0))]
            assert is_public_url("https://192.168.1.1") is False

    def test_loopback_blocked(self):
        with patch("socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(2, 1, 6, "", ("127.0.0.1", 0))]
            assert is_public_url("https://127.0.0.1") is False

    def test_link_local_blocked(self):
        with patch("socket.getaddrinfo") as mock_dns:
            mock_dns.return_value = [(2, 1, 6, "", ("169.254.169.254", 0))]
            assert is_public_url("https://169.254.169.254") is False

    def test_empty_url(self):
        assert is_public_url("") is False

    def test_none_url(self):
        assert is_public_url(None) is False

    def test_non_http_scheme(self):
        assert is_public_url("ftp://example.com") is False

    def test_unresolvable_host(self):
        import socket as _socket
        with patch("socket.getaddrinfo") as mock_dns:
            mock_dns.side_effect = _socket.gaierror("no such host")
            assert is_public_url("https://nonexistent.invalid") is False

    def test_no_hostname(self):
        assert is_public_url("https://") is False


class TestValidateEmail:
    def test_valid_email(self):
        assert validate_email("user@example.com") is True

    def test_empty_email(self):
        assert validate_email("") is False

    def test_no_at_sign(self):
        assert validate_email("userexample.com") is False

    def test_no_dot_in_domain(self):
        assert validate_email("user@localhost") is False

    def test_email_too_long(self):
        long_email = "a" * 250 + "@b.com"
        assert validate_email(long_email) is False

    def test_whitespace_trimmed(self):
        assert validate_email("  user@example.com  ") is True

    def test_none_email(self):
        assert validate_email(None) is False


class TestValidateDomain:
    def test_valid_domain(self):
        assert validate_domain("example.com") == "example.com"

    def test_domain_with_protocol(self):
        assert validate_domain("https://example.com") == "example.com"

    def test_domain_with_path(self):
        assert validate_domain("example.com/path") == "example.com"

    def test_domain_with_www(self):
        assert validate_domain("www.example.com") == "www.example.com"

    def test_empty_domain_raises(self):
        with pytest.raises(ValueError, match="Domain is required"):
            validate_domain("")

    def test_invalid_domain_raises(self):
        with pytest.raises(ValueError, match="Invalid domain"):
            validate_domain("not a domain!!!")

    def test_uppercase_normalized(self):
        assert validate_domain("EXAMPLE.COM") == "example.com"


class TestTruncate:
    def test_truncates_long_text(self):
        assert truncate("hello world", max_length=5) == "hello"

    def test_short_text_unchanged(self):
        assert truncate("hi", max_length=100) == "hi"

    def test_empty_text(self):
        assert truncate("") == ""

    def test_none_text(self):
        assert truncate(None) is None

    def test_default_max_length(self):
        long = "x" * 600
        assert len(truncate(long)) == 500
