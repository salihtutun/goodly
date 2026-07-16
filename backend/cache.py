"""Hybrid cache backend — Redis when available, in-memory fallback.

Uses Redis if REDIS_URL is configured, otherwise falls back to the
existing in-memory TTLCache. The interface is identical so callers
don't need to know which backend is active.

For production at scale, set REDIS_URL=redis://... in Cloud Run env vars.
"""

import os
import time
import functools
import json
import logging
from typing import Any, Callable, Optional

logger = logging.getLogger("cache")


# ── In-memory TTL cache (fallback) ──────────────────────

class TTLCache:
    """In-memory cache with per-key TTL expiration."""

    def __init__(self, default_ttl: float = 60.0):
        self._store: dict[str, tuple[float, Any]] = {}
        self._default_ttl = default_ttl

    def get(self, key: str) -> Optional[Any]:
        entry = self._store.get(key)
        if entry is None:
            return None
        expires_at, value = entry
        if time.monotonic() > expires_at:
            del self._store[key]
            return None
        return value

    def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        ttl = ttl if ttl is not None else self._default_ttl
        self._store[key] = (time.monotonic() + ttl, value)

    def delete(self, key: str) -> None:
        self._store.pop(key, None)

    def clear(self) -> None:
        self._store.clear()

    def __len__(self) -> int:
        now = time.monotonic()
        expired = [k for k, (exp, _) in self._store.items() if now > exp]
        for k in expired:
            del self._store[k]
        return len(self._store)


# ── Redis cache backend ─────────────────────────────────

class RedisCache:
    """Redis-backed cache with same interface as TTLCache."""

    def __init__(self, redis_url: str, default_ttl: float = 60.0):
        self._default_ttl = default_ttl
        self._redis_url = redis_url
        self._redis = None

    async def _ensure_redis(self):
        if self._redis is not None:
            return self._redis
        try:
            import redis.asyncio as aioredis
            self._redis = aioredis.from_url(
                self._redis_url,
                socket_connect_timeout=2,
                socket_timeout=2,
                decode_responses=True,
            )
            await self._redis.ping()
            logger.info("Redis cache connected")
        except Exception as e:
            logger.warning("Redis connection failed: %s — falling back to in-memory", e)
            self._redis = False  # Sentinel to avoid retrying
        return self._redis

    async def get(self, key: str) -> Optional[Any]:
        r = await self._ensure_redis()
        if not r:
            return None
        try:
            raw = await r.get(key)
            return json.loads(raw) if raw else None
        except Exception:
            return None

    async def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        r = await self._ensure_redis()
        if not r:
            return
        ttl = ttl if ttl is not None else self._default_ttl
        try:
            await r.setex(key, int(ttl), json.dumps(value, default=str))
        except Exception as e:
            logger.debug("Redis set failed: %s", e)

    async def delete(self, key: str) -> None:
        r = await self._ensure_redis()
        if not r:
            return
        try:
            await r.delete(key)
        except Exception:
            pass

    async def clear(self) -> None:
        r = await self._ensure_redis()
        if not r:
            return
        try:
            await r.flushdb()
        except Exception:
            pass


# ── Hybrid cache (auto-selects backend) ─────────────────

class HybridCache:
    """Cache that uses Redis when available, falling back to in-memory.

    Usage:
        cache = HybridCache("dashboard", default_ttl=60)
        val = await cache.get("key")
        await cache.set("key", value, ttl=30)
    """

    def __init__(self, namespace: str, default_ttl: float = 60.0):
        self._namespace = namespace
        self._default_ttl = default_ttl
        self._mem = TTLCache(default_ttl=default_ttl)
        self._redis: Optional[RedisCache] = None
        self._redis_checked = False

    def _key(self, key: str) -> str:
        return f"{self._namespace}:{key}"

    async def _get_redis(self) -> Optional[RedisCache]:
        if self._redis_checked:
            return self._redis
        self._redis_checked = True
        redis_url = os.environ.get("REDIS_URL", "")
        if redis_url:
            self._redis = RedisCache(redis_url, default_ttl=self._default_ttl)
            # Test connection
            r = await self._redis._ensure_redis()
            if not r:
                self._redis = None
        return self._redis

    async def get(self, key: str) -> Optional[Any]:
        r = await self._get_redis()
        if r:
            val = await r.get(self._key(key))
            if val is not None:
                return val
        return self._mem.get(self._key(key))

    async def set(self, key: str, value: Any, ttl: Optional[float] = None) -> None:
        r = await self._get_redis()
        if r:
            await r.set(self._key(key), value, ttl=ttl)
        self._mem.set(self._key(key), value, ttl=ttl)

    async def delete(self, key: str) -> None:
        r = await self._get_redis()
        if r:
            await r.delete(self._key(key))
        self._mem.delete(self._key(key))

    async def clear(self) -> None:
        r = await self._get_redis()
        if r:
            await r.clear()
        self._mem.clear()


# ── Global cache instances ──────────────────────────────

dashboard_cache = HybridCache("dashboard", default_ttl=60.0)
plan_cache = HybridCache("plan", default_ttl=300.0)
health_cache = HybridCache("health", default_ttl=30.0)


# ── Decorator (works with both sync TTLCache and async HybridCache) ──

def cached(cache, ttl: Optional[float] = None):
    """Decorator for async functions that caches results.

    Works with both sync TTLCache and async HybridCache.

    Usage:
        @cached(dashboard_cache, ttl=60)
        async def get_summary(user_id: str):
            ...
    """
    import inspect

    def decorator(fn: Callable):
        @functools.wraps(fn)
        async def wrapper(*args, **kwargs):
            key = str(args[0]) if args else str(kwargs.get("user_id", "__no_key__"))
            # Support both sync and async cache get
            if inspect.iscoroutinefunction(cache.get):
                cached_val = await cache.get(key)
            else:
                cached_val = cache.get(key)
            if cached_val is not None:
                return cached_val
            result = await fn(*args, **kwargs)
            # Support both sync and async cache set
            if inspect.iscoroutinefunction(cache.set):
                await cache.set(key, result, ttl=ttl)
            else:
                cache.set(key, result, ttl=ttl)
            return result
        return wrapper
    return decorator
