"""Simple TTL cache for expensive queries.

Uses an in-memory dict with per-key expiry. No external dependencies.
For production at scale, swap this for Redis — the interface stays the same.
"""
import time
import asyncio
import functools
from typing import Any, Callable, Optional


class TTLCache:
    """In-memory cache with per-key TTL expiration."""

    def __init__(self, default_ttl: float = 60.0):
        self._store: dict[str, tuple[float, Any]] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        """Return cached value if not expired, else None."""
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        """Store a value with optional per-key TTL override."""
        ttl = ttl if ttl is not None else self._default_ttl
        self._store[key] = (time.monotonic() + ttl, value)

    def delete(self, key: str) -> None:
        """Remove a key from the cache."""
        self._store.pop(key, None)

    def clear(self) -> None:
        """Remove all entries."""
        self._store.clear()

    def __len__(self) -> int:
        # Clean expired entries on len() for housekeeping
        now = time.monotonic()
        expired = [k for k, (exp, _) in self._store.items() if now > exp]
        for k in expired:
            del self._store[k]
        return len(self._store)


# Global cache instances with different TTLs
dashboard_cache = TTLCache(default_ttl=60.0)   # Per-user dashboard data
plan_cache = TTLCache(default_ttl=300.0)         # Plan definitions rarely change
health_cache = TTLCache(default_ttl=30.0)        # Health check


def cached(cache: TTLCache, ttl: Optional[float] = None):
    """Decorator for async functions that caches results by a key function.

    Usage:
        @cached(dashboard_cache, ttl=60)
        async def get_summary(user_id: str):
            ...

    The first positional argument is used as the cache key by default.
    Pass a string key_fn name to use a different argument.
    """
    def decorator(fn: Callable):
        @functools.wraps(fn)
        async def wrapper(*args, **kwargs):
            # Use first arg as key (typically user_id)
            key = str(args[0]) if args else str(kwargs.get("user_id", "__no_key__"))
            cached_val = cache.get(key)
            if cached_val is not None:
                return cached_val
            result = await fn(*args, **kwargs)
            cache.set(key, result, ttl=ttl)
            return result
        return wrapper
    return decorator
