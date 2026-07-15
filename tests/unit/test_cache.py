"""Unit tests for cache.py — TTLCache and cached decorator."""
import time
import pytest
from unittest.mock import AsyncMock, patch
from cache import TTLCache, dashboard_cache, plan_cache, health_cache, cached


class TestTTLCache:
    def test_set_and_get(self):
        c = TTLCache(default_ttl=60)
        c.set("key1", "value1")
        assert c.get("key1") == "value1"

    def test_get_missing_key(self):
        c = TTLCache()
        assert c.get("nonexistent") is None

    def test_expiry(self):
        c = TTLCache(default_ttl=0.01)
        c.set("key1", "value1")
        time.sleep(0.02)
        assert c.get("key1") is None

    def test_custom_ttl(self):
        c = TTLCache(default_ttl=60)
        c.set("key1", "value1", ttl=0.01)
        time.sleep(0.02)
        assert c.get("key1") is None

    def test_delete(self):
        c = TTLCache()
        c.set("key1", "value1")
        c.delete("key1")
        assert c.get("key1") is None

    def test_delete_nonexistent(self):
        c = TTLCache()
        c.delete("nonexistent")  # Should not raise

    def test_clear(self):
        c = TTLCache()
        c.set("a", 1)
        c.set("b", 2)
        c.clear()
        assert len(c) == 0

    def test_len(self):
        c = TTLCache()
        c.set("a", 1)
        c.set("b", 2)
        assert len(c) == 2

    def test_len_cleans_expired(self):
        c = TTLCache(default_ttl=0.01)
        c.set("a", 1)
        c.set("b", 2)
        time.sleep(0.02)
        assert len(c) == 0

    def test_default_ttl(self):
        c = TTLCache()
        assert c._default_ttl == 60.0

    def test_custom_default_ttl(self):
        c = TTLCache(default_ttl=120.0)
        assert c._default_ttl == 120.0


class TestGlobalCaches:
    def test_dashboard_cache_exists(self):
        from cache import HybridCache
        assert isinstance(dashboard_cache, HybridCache)
        assert dashboard_cache._default_ttl == 60.0

    def test_plan_cache_exists(self):
        from cache import HybridCache
        assert isinstance(plan_cache, HybridCache)
        assert plan_cache._default_ttl == 300.0

    def test_health_cache_exists(self):
        from cache import HybridCache
        assert isinstance(health_cache, HybridCache)
        assert health_cache._default_ttl == 30.0


class TestCachedDecorator:
    @pytest.mark.asyncio
    async def test_caches_result(self):
        c = TTLCache(default_ttl=60)
        mock_fn = AsyncMock(return_value="result1")

        @cached(c, ttl=60)
        async def get_data(user_id):
            return await mock_fn(user_id)

        result1 = await get_data("user1")
        assert result1 == "result1"
        assert mock_fn.call_count == 1

        # Second call should use cache
        result2 = await get_data("user1")
        assert result2 == "result1"
        assert mock_fn.call_count == 1  # Not called again

    @pytest.mark.asyncio
    async def test_different_keys_not_cached(self):
        c = TTLCache(default_ttl=60)
        mock_fn = AsyncMock(side_effect=["r1", "r2"])

        @cached(c, ttl=60)
        async def get_data(user_id):
            return await mock_fn(user_id)

        r1 = await get_data("user1")
        r2 = await get_data("user2")
        assert r1 == "r1"
        assert r2 == "r2"
        assert mock_fn.call_count == 2

    @pytest.mark.asyncio
    async def test_expired_cache_refreshes(self):
        c = TTLCache(default_ttl=0.01)
        mock_fn = AsyncMock(side_effect=["r1", "r2"])

        @cached(c, ttl=0.01)
        async def get_data(user_id):
            return await mock_fn(user_id)

        r1 = await get_data("user1")
        assert r1 == "r1"
        time.sleep(0.02)
        r2 = await get_data("user1")
        assert r2 == "r2"
        assert mock_fn.call_count == 2

    @pytest.mark.asyncio
    async def test_no_args_uses_default_key(self):
        c = TTLCache(default_ttl=60)
        mock_fn = AsyncMock(return_value="result")

        @cached(c, ttl=60)
        async def get_data():
            return await mock_fn()

        result = await get_data()
        assert result == "result"
