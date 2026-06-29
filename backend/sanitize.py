"""Input sanitization utilities for user-facing text fields.

Prevents XSS and injection attacks by stripping HTML and escaping special chars.
"""
import re
from html import escape


def sanitize_html(text: str) -> str:
    """Strip HTML tags and escape special characters."""
    if not text:
        return text
    clean = re.sub(r"<[^>]*>", "", text)
    return escape(clean, quote=False)


def sanitize_url(url: str) -> str:
    """Basic URL sanitization — ensure protocol prefix."""
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


def sanitize_name(name: str) -> str:
    """Sanitize a user/business name."""
    if not name:
        return name
    return sanitize_html(name.strip())[:200]
