"""Unit tests for validators.py."""
import os, sys, pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


class TestValidateURL:
    def test_valid_url(self):
        from validators import validate_url
        assert validate_url("https://example.com") == "https://example.com"

    def test_adds_https(self):
        from validators import validate_url
        assert validate_url("example.com") == "https://example.com"

    def test_strips_whitespace(self):
        from validators import validate_url
        assert validate_url("  https://example.com  ") == "https://example.com"

    def test_empty_raises(self):
        from validators import validate_url
        with pytest.raises(ValueError, match="required"):
            validate_url("")

    def test_invalid_raises(self):
        from validators import validate_url
        with pytest.raises(ValueError):
            validate_url("!!!")

    def test_too_long_raises(self):
        from validators import validate_url
        with pytest.raises(ValueError, match="too long"):
            validate_url("https://example.com/" + "a" * 2048)


class TestValidateEmail:
    def test_valid_email(self):
        from validators import validate_email
        assert validate_email("User@Example.COM") == "user@example.com"

    def test_empty_raises(self):
        from validators import validate_email
        with pytest.raises(ValueError, match="required"):
            validate_email("")

    def test_no_at_raises(self):
        from validators import validate_email
        with pytest.raises(ValueError, match="Invalid email"):
            validate_email("notanemail")

    def test_no_dot_raises(self):
        from validators import validate_email
        with pytest.raises(ValueError, match="Invalid email"):
            validate_email("user@nodot")

    def test_too_long_raises(self):
        from validators import validate_email
        with pytest.raises(ValueError, match="too long"):
            validate_email("a" * 255 + "@b.com")


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
