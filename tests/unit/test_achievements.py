"""Unit tests for achievements.py — check_achievements, get_all_achievements."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch


def _make_async_cursor(return_value):
    """Helper to create a mock cursor chain: find().sort().to_list() -> return_value."""
    cursor = MagicMock()
    cursor.sort.return_value = cursor
    cursor.to_list = AsyncMock(return_value=return_value)
    return cursor


class TestCheckAchievements:
    @pytest.mark.asyncio
    async def test_user_not_found(self):
        from achievements import check_achievements
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value=None)
        result = await check_achievements(mock_db, "u1")
        assert result == []

    @pytest.mark.asyncio
    async def test_first_audit_achievement(self):
        from achievements import check_achievements
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": []})
        mock_db.audits.count_documents = AsyncMock(return_value=1)
        mock_db.audits.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.serp_checks.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.referrals.count_documents = AsyncMock(return_value=0)
        mock_db.users.update_one = AsyncMock()
        result = await check_achievements(mock_db, "u1")
        assert any(a["id"] == "first_audit" for a in result)

    @pytest.mark.asyncio
    async def test_audit_10_achievement(self):
        from achievements import check_achievements
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": ["first_audit"]})
        mock_db.audits.count_documents = AsyncMock(return_value=10)
        mock_db.audits.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.serp_checks.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.referrals.count_documents = AsyncMock(return_value=0)
        mock_db.users.update_one = AsyncMock()
        result = await check_achievements(mock_db, "u1")
        assert any(a["id"] == "audit_10" for a in result)

    @pytest.mark.asyncio
    async def test_audit_50_achievement(self):
        from achievements import check_achievements
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": ["first_audit", "audit_10"]})
        mock_db.audits.count_documents = AsyncMock(return_value=50)
        mock_db.audits.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.serp_checks.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.referrals.count_documents = AsyncMock(return_value=0)
        mock_db.users.update_one = AsyncMock()
        result = await check_achievements(mock_db, "u1")
        assert any(a["id"] == "audit_50" for a in result)

    @pytest.mark.asyncio
    async def test_score_improver_achievement(self):
        from achievements import check_achievements
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": ["first_audit"]})
        mock_db.audits.count_documents = AsyncMock(return_value=2)
        mock_db.audits.find = MagicMock(return_value=_make_async_cursor([
            {"result": {"overall_score": 80}},
            {"result": {"overall_score": 65}},
        ]))
        mock_db.serp_checks.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.referrals.count_documents = AsyncMock(return_value=0)
        mock_db.users.update_one = AsyncMock()
        result = await check_achievements(mock_db, "u1")
        assert any(a["id"] == "score_improver" for a in result)

    @pytest.mark.asyncio
    async def test_score_master_achievement(self):
        from achievements import check_achievements
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": ["first_audit"]})
        mock_db.audits.count_documents = AsyncMock(return_value=2)
        mock_db.audits.find = MagicMock(return_value=_make_async_cursor([
            {"result": {"overall_score": 90}},
            {"result": {"overall_score": 60}},
        ]))
        mock_db.serp_checks.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.referrals.count_documents = AsyncMock(return_value=0)
        mock_db.users.update_one = AsyncMock()
        result = await check_achievements(mock_db, "u1")
        assert any(a["id"] == "score_master" for a in result)

    @pytest.mark.asyncio
    async def test_perfect_score_achievement(self):
        from achievements import check_achievements
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": []})
        mock_db.audits.count_documents = AsyncMock(return_value=2)
        mock_db.audits.find = MagicMock(return_value=_make_async_cursor([
            {"result": {"overall_score": 92}},
            {"result": {"overall_score": 88}},
        ]))
        mock_db.serp_checks.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.referrals.count_documents = AsyncMock(return_value=0)
        mock_db.users.update_one = AsyncMock()
        result = await check_achievements(mock_db, "u1")
        assert any(a["id"] == "perfect_score" for a in result)

    @pytest.mark.asyncio
    async def test_keyword_winner_achievement(self):
        from achievements import check_achievements
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": []})
        mock_db.audits.count_documents = AsyncMock(return_value=1)
        mock_db.audits.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.serp_checks.find = MagicMock(return_value=_make_async_cursor([
            {"rank": 2}, {"rank": 5},
        ]))
        mock_db.referrals.count_documents = AsyncMock(return_value=0)
        mock_db.users.update_one = AsyncMock()
        result = await check_achievements(mock_db, "u1")
        assert any(a["id"] == "keyword_winner" for a in result)

    @pytest.mark.asyncio
    async def test_referral_3_achievement(self):
        from achievements import check_achievements
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": []})
        mock_db.audits.count_documents = AsyncMock(return_value=0)
        mock_db.audits.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.serp_checks.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.referrals.count_documents = AsyncMock(return_value=3)
        mock_db.users.update_one = AsyncMock()
        result = await check_achievements(mock_db, "u1")
        assert any(a["id"] == "referral_3" for a in result)

    @pytest.mark.asyncio
    async def test_already_earned_not_duplicated(self):
        from achievements import check_achievements
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": ["first_audit", "audit_10"]})
        mock_db.audits.count_documents = AsyncMock(return_value=10)
        mock_db.audits.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.serp_checks.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.referrals.count_documents = AsyncMock(return_value=0)
        mock_db.users.update_one = AsyncMock()
        result = await check_achievements(mock_db, "u1")
        assert not any(a["id"] == "first_audit" for a in result)
        assert not any(a["id"] == "audit_10" for a in result)

    @pytest.mark.asyncio
    async def test_uses_overall_score_fallback(self):
        from achievements import check_achievements
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": []})
        mock_db.audits.count_documents = AsyncMock(return_value=2)
        mock_db.audits.find = MagicMock(return_value=_make_async_cursor([
            {"overall_score": 85},
            {"overall_score": 70},
        ]))
        mock_db.serp_checks.find = MagicMock(return_value=_make_async_cursor([]))
        mock_db.referrals.count_documents = AsyncMock(return_value=0)
        mock_db.users.update_one = AsyncMock()
        result = await check_achievements(mock_db, "u1")
        assert any(a["id"] == "score_improver" for a in result)


class TestGetAllAchievements:
    def test_returns_all(self):
        from achievements import get_all_achievements, ACHIEVEMENTS
        result = get_all_achievements()
        assert len(result) == len(ACHIEVEMENTS)
        assert any(a["id"] == "first_audit" for a in result)
