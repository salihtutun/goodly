"""Input validation utilities — URL, email, and domain sanitization."""
import ipaddress
import re
import socket
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


def is_public_url(url: str) -> bool:
    """SSRF guard: True only if the URL's host resolves exclusively to public IPs.

    Blocks loopback, RFC1918/private, link-local (incl. cloud metadata
    169.254.169.254), reserved, and multicast addresses.

    NOTE: This function performs blocking DNS resolution. Call it via
    asyncio.to_thread(is_public_url, url) from async code to avoid
    blocking the event loop.
    """
    if not url or not url.strip():
        return False
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return False
    host = parsed.hostname
    if not host:
        return False
    try:
        addr_infos = socket.getaddrinfo(host, None)
    except socket.gaierror:
        # Unresolvable hosts can't be fetched anyway; treat as not public.
        return False
    for info in addr_infos:
        try:
            ip = ipaddress.ip_address(info[4][0])
        except ValueError:
            return False
        if (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or ip.is_unspecified
        ):
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
