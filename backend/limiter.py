"""Shared rate limiter for all route modules.

Import this single instance everywhere instead of creating new Limiters.

When the API sits behind Vercel/Cloud Run proxies, Starlette's
``request.client.host`` is the proxy IP — so every visitor shared one
bucket and public audits hit 429 after ~10 site-wide requests/minute.
Prefer the left-most ``X-Forwarded-For`` hop (set by the edge) instead.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_client_ip(request) -> str:
    """Best-effort real client IP behind Vercel / Cloud Run / load balancers."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # Left-most is the original client (Vercel appends hops).
        ip = forwarded.split(",")[0].strip()
        if ip:
            return ip
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return real_ip.strip()
    # Vercel-specific fallback
    vercel_ip = request.headers.get("x-vercel-forwarded-for")
    if vercel_ip:
        return vercel_ip.split(",")[0].strip()
    return get_remote_address(request) or "unknown"


limiter = Limiter(
    key_func=get_client_ip,
    default_limits=["200/minute"],
    headers_enabled=False,  # Disabled: slowapi crashes on plain dict responses before FastAPI converts them
)
