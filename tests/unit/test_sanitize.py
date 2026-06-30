"""Unit tests for sanitize.py — input sanitization utilities."""
import pytest
from sanitize import sanitize_html, sanitize_url, sanitize_name


# ---------------------------------------------------------------------------
# sanitize_html
# ---------------------------------------------------------------------------

def test_sanitize_html_strips_tags():
    """sanitize_html removes HTML tags from the input.
    Note: tags are stripped first, then escape() is called.
    So text content between tags remains but is escaped."""
    result = sanitize_html("<script>alert('xss')</script>Hello")
    assert "<script>" not in result
    assert "</script>" not in result
    # The text content "alert('xss')" remains after tag stripping
    assert "Hello" in result


def test_sanitize_html_escapes_special_chars():
    """sanitize_html escapes &, <, > characters.
    Note: '< C >' matches the tag regex and gets stripped entirely,
    so only 'A & B' and 'D' remain after processing."""
    result = sanitize_html("A & B < C > D")
    assert "&amp;" in result
    # '< C >' is treated as an HTML tag and stripped
    assert "A &amp; B" in result
    assert "D" in result


def test_sanitize_html_empty_string():
    """sanitize_html returns empty string unchanged."""
    result = sanitize_html("")
    assert result == ""


def test_sanitize_html_none():
    """sanitize_html returns None unchanged (falsy check)."""
    result = sanitize_html(None)
    assert result is None


def test_sanitize_html_plain_text_unchanged():
    """sanitize_html leaves plain text without HTML unchanged."""
    result = sanitize_html("Just some normal text.")
    assert result == "Just some normal text."


def test_sanitize_html_nested_tags():
    """sanitize_html strips nested HTML tags."""
    result = sanitize_html("<div><p>Nested <b>content</b></p></div>")
    assert "<div>" not in result
    assert "<p>" not in result
    assert "<b>" not in result
    assert "Nested content" in result


def test_sanitize_html_self_closing_tags():
    """sanitize_html strips self-closing tags like <br/> and <img/>."""
    result = sanitize_html("Line 1<br/>Line 2<img src='x'/>")
    assert "<br/>" not in result
    assert "<img" not in result
    assert "Line 1Line 2" in result


# ---------------------------------------------------------------------------
# sanitize_url
# ---------------------------------------------------------------------------

def test_sanitize_url_adds_https():
    """sanitize_url prepends https:// when no protocol is present."""
    result = sanitize_url("example.com")
    assert result == "https://example.com"


def test_sanitize_url_preserves_existing_https():
    """sanitize_url keeps existing https:// prefix."""
    result = sanitize_url("https://example.com/page")
    assert result == "https://example.com/page"


def test_sanitize_url_preserves_existing_http():
    """sanitize_url keeps existing http:// prefix."""
    result = sanitize_url("http://example.com")
    assert result == "http://example.com"


def test_sanitize_url_strips_whitespace():
    """sanitize_url strips leading/trailing whitespace."""
    result = sanitize_url("  example.com  ")
    assert result == "https://example.com"


def test_sanitize_url_with_path():
    """sanitize_url handles URLs with paths."""
    result = sanitize_url("example.com/path/to/page?q=1")
    assert result == "https://example.com/path/to/page?q=1"


# ---------------------------------------------------------------------------
# sanitize_name
# ---------------------------------------------------------------------------

def test_sanitize_name_truncates():
    """sanitize_name truncates names longer than 200 characters."""
    long_name = "A" * 250
    result = sanitize_name(long_name)
    assert len(result) == 200
    assert result == "A" * 200


def test_sanitize_name_empty():
    """sanitize_name returns empty string unchanged."""
    result = sanitize_name("")
    assert result == ""


def test_sanitize_name_none():
    """sanitize_name returns None unchanged."""
    result = sanitize_name(None)
    assert result is None


def test_sanitize_name_strips_whitespace():
    """sanitize_name strips leading/trailing whitespace."""
    result = sanitize_name("  John Doe  ")
    assert result == "John Doe"


def test_sanitize_name_strips_html():
    """sanitize_name strips HTML tags from the name."""
    result = sanitize_name("<b>John</b> Doe")
    assert "<b>" not in result
    assert "John Doe" in result


def test_sanitize_name_short_name_unchanged():
    """sanitize_name returns short names unchanged."""
    result = sanitize_name("Jane")
    assert result == "Jane"
