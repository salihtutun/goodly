"""Tests for the achievement/badge system."""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from achievements import (
    ACHIEVEMENTS,
    check_achievements,
    get_all_achievements,
)


class TestAchievements:
    """Test achievement definitions and helper functions."""

    def test_get_all_achievements_returns_list(self):
        """get_all_achievements should return all defined achievements."""
        all_ach = get_all_achievements()
        assert len(all_ach) == len(ACHIEVEMENTS)
        assert all_ach[0]["id"] in ACHIEVEMENTS

    def test_achievements_have_required_fields(self):
        """Every achievement should have id, name, description, icon, category."""
        for ach in ACHIEVEMENTS.values():
            assert "id" in ach
            assert "name" in ach
            assert "description" in ach
            assert "icon" in ach
            assert "category" in ach

    def test_achievement_categories(self):
        """Achievements should span multiple categories."""
        categories = {a["category"] for a in ACHIEVEMENTS.values()}
        assert "onboarding" in categories
        assert "progress" in categories
        assert "serp" in categories
        assert "streak" in categories
        assert "volume" in categories
        assert "excellence" in categories

    @pytest.mark.asyncio
    async def test_check_achievements_first_audit(self):
        """First audit should earn the first_audit achievement."""
        db = MagicMock()
        db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": []})
        db.audits.count_documents = AsyncMock(return_value=1)
        db.audits.find = MagicMock()
        db.audits.find.return_value.to_list = AsyncMock(return_value=[
            {"overall_score": 65, "created_at": "2025-01-01"},
        ])
        db.serp_checks.find = MagicMock()
        db.serp_checks.find.return_value.to_list = AsyncMock(return_value=[])
        db.referrals.count_documents = AsyncMock(return_value=0)
        db.users.update_one = AsyncMock()

        new_ach = await check_achievements(db, "u1")
        ids = [a["id"] for a in new_ach]
        assert "first_audit" in ids

    @pytest.mark.asyncio
    async def test_check_achievements_score_improver(self):
        """Score improvement of 10+ should earn score_improver."""
        db = MagicMock()
        db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": ["first_audit"]})
        db.audits.count_documents = AsyncMock(return_value=2)
        db.audits.find = MagicMock()
        db.audits.find.return_value.to_list = AsyncMock(return_value=[
            {"overall_score": 75, "created_at": "2025-01-02"},
            {"overall_score": 60, "created_at": "2025-01-01"},
        ])
        db.serp_checks.find = MagicMock()
        db.serp_checks.find.return_value.to_list = AsyncMock(return_value=[])
        db.referrals.count_documents = AsyncMock(return_value=0)
        db.users.update_one = AsyncMock()

        new_ach = await check_achievements(db, "u1")
        ids = [a["id"] for a in new_ach]
        assert "score_improver" in ids

    @pytest.mark.asyncio
    async def test_check_achievements_score_master(self):
        """Score improvement of 25+ should earn score_master."""
        db = MagicMock()
        db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": ["first_audit", "score_improver"]})
        db.audits.count_documents = AsyncMock(return_value=2)
        db.audits.find = MagicMock()
        db.audits.find.return_value.to_list = AsyncMock(return_value=[
            {"overall_score": 85, "created_at": "2025-01-02"},
            {"overall_score": 55, "created_at": "2025-01-01"},
        ])
        db.serp_checks.find = MagicMock()
        db.serp_checks.find.return_value.to_list = AsyncMock(return_value=[])
        db.referrals.count_documents = AsyncMock(return_value=0)
        db.users.update_one = AsyncMock()

        new_ach = await check_achievements(db, "u1")
        ids = [a["id"] for a in new_ach]
        assert "score_master" in ids

    @pytest.mark.asyncio
    async def test_check_achievements_perfect_score(self):
        """Score of 90+ should earn perfect_score."""
        db = MagicMock()
        db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": []})
        db.audits.count_documents = AsyncMock(return_value=2)
        db.audits.find = MagicMock()
        db.audits.find.return_value.to_list = AsyncMock(return_value=[
            {"overall_score": 92, "created_at": "2025-01-02"},
            {"overall_score": 60, "created_at": "2025-01-01"},
        ])
        db.serp_checks.find = MagicMock()
        db.serp_checks.find.return_value.to_list = AsyncMock(return_value=[])
        db.referrals.count_documents = AsyncMock(return_value=0)
        db.users.update_one = AsyncMock()

        new_ach = await check_achievements(db, "u1")
        ids = [a["id"] for a in new_ach]
        assert "perfect_score" in ids

    @pytest.mark.asyncio
    async def test_check_achievements_audit_volume(self):
        """10+ audits should earn audit_10."""
        db = MagicMock()
        db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": ["first_audit"]})
        db.audits.count_documents = AsyncMock(return_value=10)
        db.audits.find = MagicMock()
        db.audits.find.return_value.to_list = AsyncMock(return_value=[
            {"overall_score": 70, "created_at": "2025-01-01"},
        ])
        db.serp_checks.find = MagicMock()
        db.serp_checks.find.return_value.to_list = AsyncMock(return_value=[])
        db.referrals.count_documents = AsyncMock(return_value=0)
        db.users.update_one = AsyncMock()

        new_ach = await check_achievements(db, "u1")
        ids = [a["id"] for a in new_ach]
        assert "audit_10" in ids

    @pytest.mark.asyncio
    async def test_check_achievements_keyword_winner(self):
        """Keyword in top 3 should earn keyword_winner."""
        db = MagicMock()
        db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": []})
        db.audits.count_documents = AsyncMock(return_value=1)
        db.audits.find = MagicMock()
        db.audits.find.return_value.to_list = AsyncMock(return_value=[
            {"overall_score": 70, "created_at": "2025-01-01"},
        ])
        # Mock: await db.serp_checks.find(...).to_list(50)
        mock_cursor = MagicMock()
        mock_cursor.to_list = AsyncMock(return_value=[
            {"rank": 2, "created_at": "2025-01-02"},
            {"rank": 8, "created_at": "2025-01-01"},
        ])
        db.serp_checks.find = MagicMock(return_value=mock_cursor)
        db.referrals.count_documents = AsyncMock(return_value=0)
        db.users.update_one = AsyncMock()

        new_ach = await check_achievements(db, "u1")
        ids = [a["id"] for a in new_ach]
        assert "keyword_winner" in ids

    @pytest.mark.asyncio
    async def test_check_achievements_referral(self):
        """3+ referrals should earn referral_3."""
        db = MagicMock()
        db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": ["first_audit"]})
        db.audits.count_documents = AsyncMock(return_value=1)
        db.audits.find = MagicMock()
        db.audits.find.return_value.to_list = AsyncMock(return_value=[
            {"overall_score": 70, "created_at": "2025-01-01"},
        ])
        db.serp_checks.find = MagicMock()
        db.serp_checks.find.return_value.to_list = AsyncMock(return_value=[])
        db.referrals.count_documents = AsyncMock(return_value=3)
        db.users.update_one = AsyncMock()

        new_ach = await check_achievements(db, "u1")
        ids = [a["id"] for a in new_ach]
        assert "referral_3" in ids

    @pytest.mark.asyncio
    async def test_check_achievements_no_duplicates(self):
        """Already earned achievements should not be returned again."""
        db = MagicMock()
        db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": ["first_audit", "score_improver"]})
        db.audits.count_documents = AsyncMock(return_value=2)
        db.audits.find = MagicMock()
        db.audits.find.return_value.to_list = AsyncMock(return_value=[
            {"overall_score": 75, "created_at": "2025-01-02"},
            {"overall_score": 60, "created_at": "2025-01-01"},
        ])
        db.serp_checks.find = MagicMock()
        db.serp_checks.find.return_value.to_list = AsyncMock(return_value=[])
        db.referrals.count_documents = AsyncMock(return_value=0)
        db.users.update_one = AsyncMock()

        new_ach = await check_achievements(db, "u1")
        ids = [a["id"] for a in new_ach]
        assert "first_audit" not in ids  # Already earned
        assert "score_improver" not in ids  # Already earned

    @pytest.mark.asyncio
    async def test_check_achievements_no_user(self):
        """Should return empty list if user not found."""
        db = MagicMock()
        db.users.find_one = AsyncMock(return_value=None)

        new_ach = await check_achievements(db, "nonexistent")
        assert new_ach == []

    @pytest.mark.asyncio
    async def test_check_achievements_saves_new(self):
        """Newly earned achievements should be saved to DB."""
        db = MagicMock()
        db.users.find_one = AsyncMock(return_value={"id": "u1", "achievements": []})
        db.audits.count_documents = AsyncMock(return_value=1)
        db.audits.find = MagicMock()
        db.audits.find.return_value.to_list = AsyncMock(return_value=[
            {"overall_score": 70, "created_at": "2025-01-01"},
        ])
        db.serp_checks.find = MagicMock()
        db.serp_checks.find.return_value.to_list = AsyncMock(return_value=[])
        db.referrals.count_documents = AsyncMock(return_value=0)
        db.users.update_one = AsyncMock()

        await check_achievements(db, "u1")
        db.users.update_one.assert_called_once()
