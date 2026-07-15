"""Unit tests for dependencies.py — helpers, user lookup, usage tracking, base URL."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class TestNowIso:
    def test_returns_iso_string(self):
        from dependencies import now_iso
        result = now_iso()
        assert "T" in result
        assert result.endswith("+00:00") or result.endswith("Z")


class TestPublicUser:
    def test_full_user(self):
        from dependencies import public_user
        doc = {
            "id": "u1", "email": "test@test.com", "name": "Test User",
            "role": "admin", "plan": "pro", "onboarded": True,
            "email_verified": True, "created_at": "2024-01-01T00:00:00",
        }
        result = public_user(doc)
        assert result["id"] == "u1"
        assert result["email"] == "test@test.com"
        assert result["name"] == "Test User"
        assert result["role"] == "admin"
        assert result["plan"] == "pro"
        assert result["onboarded"] is True
        assert result["email_verified"] is True

    def test_minimal_user(self):
        from dependencies import public_user
        doc = {"id": "u1", "email": "test@test.com"}
        result = public_user(doc)
        assert result["name"] == "test"
        assert result["role"] == "user"
        assert result["plan"] == "free"
        assert result["onboarded"] is False
        assert result["email_verified"] is False

    def test_no_name_uses_email_prefix(self):
        from dependencies import public_user
        doc = {"id": "u1", "email": "john.doe@example.com"}
        result = public_user(doc)
        assert result["name"] == "john.doe"


class TestGetUser:
    @pytest.mark.asyncio
    async def test_returns_user(self):
        with patch("dependencies.db") as mock_db:
            from dependencies import get_user
            mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "email": "a@b.com"})
            result = await get_user("u1")
            assert result["id"] == "u1"

    @pytest.mark.asyncio
    async def test_user_not_found_raises(self):
        with patch("dependencies.db") as mock_db:
            from dependencies import get_user
            mock_db.users.find_one = AsyncMock(return_value=None)
            with pytest.raises(Exception) as exc:
                await get_user("u1")
            assert exc.value.status_code == 401


class TestUsageFor:
    @pytest.mark.asyncio
    async def test_returns_usage(self):
        with patch("dependencies.db") as mock_db:
            from dependencies import usage_for
            mock_db.audits.count_documents = AsyncMock(return_value=5)
            mock_db.projects.count_documents = AsyncMock(return_value=3)
            result = await usage_for("u1")
            assert result["audits_this_month"] == 5
            assert result["projects_count"] == 3
            assert "month" in result


class TestInvalidateDashboardCache:
    @pytest.mark.asyncio
    async def test_clears_cache_keys(self):
        mock_delete = AsyncMock()
        with patch("dependencies.dashboard_cache") as mock_cache:
            mock_cache.delete = mock_delete
            from dependencies import _invalidate_dashboard_cache
            await _invalidate_dashboard_cache("u1")
            assert mock_delete.call_count == 4
            mock_delete.assert_any_call("summary:u1")
            mock_delete.assert_any_call("achievements:u1")
            mock_delete.assert_any_call("visibility:u1")
            mock_delete.assert_any_call("notifications:u1")


class TestStoreBaseUrl:
    def test_uses_frontend_url_env(self):
        with patch("os.environ.get", return_value="https://searchgoodly.com"):
            from dependencies import _store_base_url
            mock_request = MagicMock()
            result = _store_base_url(mock_request)
            assert result == "https://searchgoodly.com"

    def test_falls_back_to_request_url(self):
        with patch("os.environ.get", return_value=""):
            from dependencies import _store_base_url
            mock_request = MagicMock()
            mock_request.base_url = "http://localhost:8001/"
            result = _store_base_url(mock_request)
            assert result == "http://localhost:8001"
