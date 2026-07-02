"""Unit tests for validators.py."""
import os, sys, pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


class TestValidateURL:
    def test_valid_url(self):
        from validators import validate_url
        assert validate_url("https://example.com") is True

    def test_url_without_protocol(self):
        from validators import validate_url
        assert validate_url("example.com") is True

    def test_url_with_whitespace(self):
        from validators import validate_url
        assert validate_url("  https://example.com  ") is True

    def test_empty_returns_false(self):
        from validators import validate_url
        assert validate_url("") is False

    def test_none_returns_false(self):
        from validators import validate_url
        assert validate_url(None) is False

    def test_invalid_returns_false(self):
        from validators import validate_url
        assert validate_url("!!!") is False

    def test_no_dot_returns_false(self):
        from validators import validate_url
        assert validate_url("https://localhost") is False

    def test_too_long_returns_false(self):
        from validators import validate_url
        assert validate_url("https://example.com/" + "a" * 2048) is False

    def test_subdomain(self):
        from validators import validate_url
        assert validate_url("https://blog.example.com") is True

    def test_with_path(self):
        from validators import validate_url
        assert validate_url("https://example.com/path/to/page") is True


class TestValidateEmail:
    def test_valid_email(self):
        from validators import validate_email
        assert validate_email("User@Example.COM") is True

    def test_empty_returns_false(self):
        from validators import validate_email
        assert validate_email("") is False

    def test_none_returns_false(self):
        from validators import validate_email
        assert validate_email(None) is False

    def test_no_at_returns_false(self):
        from validators import validate_email
        assert validate_email("notanemail") is False

    def test_no_dot_returns_false(self):
        from validators import validate_email
        assert validate_email("user@nodot") is False

    def test_too_long_returns_false(self):
        from validators import validate_email
        assert validate_email("a" * 255 + "@b.com") is False

    def test_standard_email(self):
        from validators import validate_email
        assert validate_email("hello@example.com") is True


class TestValidateDomain:
    def test_valid_domain(self):
        from validators import validate_domain
        assert validate_domain("example.com") == "example.com"

    def test_strips_protocol(self):
        from validators import validate_domain
        assert validate_domain("https://example.com") == "example.com"

    def test_strips_path(self):
        from validators import validate_domain
        assert validate_domain("example.com/path") == "example.com"

    def test_empty_raises(self):
        from validators import validate_domain
        with pytest.raises(ValueError, match="required"):
            validate_domain("")

    def test_invalid_raises(self):
        from validators import validate_domain
        with pytest.raises(ValueError):
            validate_domain("not a domain")


class TestTruncate:
    def test_truncate(self):
        from validators import truncate
        assert truncate("hello", 3) == "hel"

    def test_no_truncate(self):
        from validators import truncate
        assert truncate("hello", 10) == "hello"

    def test_none(self):
        from validators import truncate
        assert truncate(None) is None
