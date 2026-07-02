"""Input validation utilities — URL, email, and domain sanitization."""
import re
from urllib.parse import urlparse


def validate_url(url: str) -> str:
    """Validate and normalize a URL. Returns cleaned URL or raises ValueError."""
    url = url.strip()
    if not url:
        raise ValueError("URL is required")
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    if not parsed.netloc:
        raise ValueError(f"Invalid URL: {url}")
    # Require at least one dot in the domain (e.g., example.com)
    if "." not in parsed.netloc:
        raise ValueError(f"Invalid URL — domain must contain a dot: {url}")
    if len(url) > 2048:
        raise ValueError("URL is too long (max 2048 characters)")
    return url


def validate_email(email: str) -> str:
    """Basic email validation. Returns cleaned email or raises ValueError."""
    email = email.strip().lower()
    if not email:
        raise ValueError("Email is required")
    if "@" not in email or "." not in email.split("@")[-1]:
        raise ValueError("Invalid email format")
    if len(email) > 254:
        raise ValueError("Email is too long")
    return email


def validate_domain(domain: str) -> str:
    """Validate and normalize a domain name."""
    domain = domain.strip().lower()
    if not domain:
        raise ValueError("Domain is required")
    # Remove protocol if present
    domain = re.sub(r"^https?://", "", domain)
    # Remove path
    domain = domain.split("/")[0]
    if not re.match(r"^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$", domain):
        raise ValueError(f"Invalid domain: {domain}")
    return domain


def truncate(text: str, max_length: int = 500) -> str:
    """Truncate text to max_length characters."""
    if not text:
        return text
    return text[:max_length]
