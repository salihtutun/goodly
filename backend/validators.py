"""Input validation utilities — URL, email, and domain sanitization."""
import re
from urllib.parse import urlparse


def validate_url(url: str) -> bool:
    """Validate a URL. Returns True if valid, False otherwise."""
    if not url or not url.strip():
        return False
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    if not parsed.netloc:
        return False
    if "." not in parsed.netloc:
        return False
    if len(url) > 2048:
        return False
    return True


def validate_email(email: str) -> bool:
    """Basic email validation. Returns True if valid, False otherwise."""
    if not email or not email.strip():
        return False
    email = email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1]:
        return False
    if len(email) > 254:
        return False
    return True


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
