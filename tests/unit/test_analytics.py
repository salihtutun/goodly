"""Unit tests for analytics.py — funnel metrics, MRR, churn, feature adoption, daily metrics."""
import pytest
from unittest.mock import AsyncMock, patch


class TestGetFunnelMetrics:
    """Tests for get_funnel_metrics()."""

    @pytest.mark.asyncio
    async def test_returns_funnel_data(self):
        from analytics import get_funnel_metrics
        with patch("analytics.db") as mock_db:
            mock_db.users.count_documents = AsyncMock(return_value=100)
            mock_db.audits.aggregate.return_value.to_list = AsyncMock(return_value=[{"count": 50}])
            mock_db.concierge_briefs.count_documents = AsyncMock(return_value=5)
            result = await get_funnel_metrics(days=30)
            assert result["period_days"] == 30
            assert result["funnel"]["signups"] == 100
            assert result["funnel"]["ran_audit"] == 50
            assert result["funnel"]["concierge"] == 5
            assert "conversion_rates" in result

    @pytest.mark.asyncio
    async def test_zero_signups(self):
        from analytics import get_funnel_metrics
        with patch("analytics.db") as mock_db:
            mock_db.users.count_documents = AsyncMock(return_value=0)
            mock_db.audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.concierge_briefs.count_documents = AsyncMock(return_value=0)
            result = await get_funnel_metrics(days=30)
            assert result["conversion_rates"]["signup_to_audit"] == 0

    @pytest.mark.asyncio
    async def test_empty_aggregate_result(self):
        from analytics import get_funnel_metrics
        with patch("analytics.db") as mock_db:
            mock_db.users.count_documents = AsyncMock(return_value=10)
            mock_db.audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.concierge_briefs.count_documents = AsyncMock(return_value=0)
            result = await get_funnel_metrics(days=30)
            assert result["funnel"]["ran_audit"] == 0


class TestGetMRR:
    """Tests for get_mrr()."""

    @pytest.mark.asyncio
    async def test_calculates_mrr(self):
        from analytics import get_mrr
        with patch("analytics.db") as mock_db:
            mock_db.users.aggregate.return_value.to_list = AsyncMock(return_value=[
                {"_id": "free", "count": 50},
                {"_id": "starter", "count": 10},
                {"_id": "pro", "count": 5},
                {"_id": "concierge", "count": 2},
            ])
            result = await get_mrr()
            assert result["mrr"] == (10 * 49 + 5 * 149 + 2 * 1000)
            assert result["arr"] == result["mrr"] * 12
            assert result["total_paying_users"] == 17
            assert result["arpu"] > 0

    @pytest.mark.asyncio
    async def test_no_users(self):
        from analytics import get_mrr
        with patch("analytics.db") as mock_db:
            mock_db.users.aggregate.return_value.to_list = AsyncMock(return_value=[])
            result = await get_mrr()
            assert result["mrr"] == 0
            assert result["total_paying_users"] == 0
            assert result["arpu"] == 0

    @pytest.mark.asyncio
    async def test_null_plan_treated_as_free(self):
        from analytics import get_mrr
        with patch("analytics.db") as mock_db:
            mock_db.users.aggregate.return_value.to_list = AsyncMock(return_value=[
                {"_id": None, "count": 5},
            ])
            result = await get_mrr()
            assert result["mrr"] == 0
            assert result["plan_breakdown"]["free"]["users"] == 5


class TestGetChurnIndicators:
    """Tests for get_churn_indicators()."""

    @pytest.mark.asyncio
    async def test_identifies_at_risk_users(self):
        from analytics import get_churn_indicators
        with patch("analytics.db") as mock_db:
            mock_db.audits.aggregate.return_value.to_list = AsyncMock(return_value=[
                {"_id": "active_user"}
            ])
            mock_db.social_audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.gbp_audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.ai_visibility_checks.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.users.find.return_value.to_list = AsyncMock(return_value=[
                {"id": "active_user", "email": "a@b.com", "name": "Active", "plan": "pro"},
                {"id": "inactive_user", "email": "c@d.com", "name": "Inactive", "plan": "starter"},
            ])
            result = await get_churn_indicators(days_inactive=14)
            assert result["total_paying_users"] == 2
            assert result["at_risk_count"] == 1
            assert result["at_risk_users"][0]["user_id"] == "inactive_user"

    @pytest.mark.asyncio
    async def test_no_paying_users(self):
        from analytics import get_churn_indicators
        with patch("analytics.db") as mock_db:
            mock_db.audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.social_audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.gbp_audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.ai_visibility_checks.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.users.find.return_value.to_list = AsyncMock(return_value=[])
            result = await get_churn_indicators()
            assert result["at_risk_rate"] == 0


class TestGetFeatureAdoption:
    """Tests for get_feature_adoption()."""

    @pytest.mark.asyncio
    async def test_returns_adoption_data(self):
        from analytics import get_feature_adoption
        with patch("analytics.db") as mock_db:
            mock_db.users.count_documents = AsyncMock(return_value=100)
            mock_db.audits.aggregate.return_value.to_list = AsyncMock(return_value=[{"count": 80}])
            mock_db.social_audits.aggregate.return_value.to_list = AsyncMock(return_value=[{"count": 30}])
            mock_db.gbp_audits.aggregate.return_value.to_list = AsyncMock(return_value=[{"count": 20}])
            mock_db.ai_visibility_checks.aggregate.return_value.to_list = AsyncMock(return_value=[{"count": 15}])
            mock_db.serp_checks.aggregate.return_value.to_list = AsyncMock(return_value=[{"count": 25}])
            mock_db.ai_history.aggregate.return_value.to_list = AsyncMock(return_value=[{"count": 40}])
            mock_db.concierge_briefs.aggregate.return_value.to_list = AsyncMock(return_value=[{"count": 5}])
            result = await get_feature_adoption()
            assert result["total_users"] == 100
            assert result["features"]["seo_audit"]["users"] == 80
            assert result["features"]["seo_audit"]["adoption_pct"] == 80.0
            assert result["features"]["referrals"]["users"] == 0

    @pytest.mark.asyncio
    async def test_zero_users(self):
        from analytics import get_feature_adoption
        with patch("analytics.db") as mock_db:
            mock_db.users.count_documents = AsyncMock(return_value=0)
            mock_db.audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.social_audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.gbp_audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.ai_visibility_checks.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.serp_checks.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.ai_history.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.concierge_briefs.aggregate.return_value.to_list = AsyncMock(return_value=[])
            result = await get_feature_adoption()
            assert result["total_users"] == 0
            assert result["features"]["seo_audit"]["adoption_pct"] == 0


class TestGetDailyMetrics:
    """Tests for get_daily_metrics()."""

    @pytest.mark.asyncio
    async def test_returns_daily_data(self):
        from analytics import get_daily_metrics
        with patch("analytics.db") as mock_db:
            mock_db.users.aggregate.return_value.to_list = AsyncMock(return_value=[
                {"_id": "2024-01-15", "count": 5},
            ])
            mock_db.audits.aggregate.return_value.to_list = AsyncMock(return_value=[
                {"_id": "2024-01-15", "count": 10},
            ])
            result = await get_daily_metrics(days=7)
            assert result["period_days"] == 7
            assert len(result["daily"]) == 7
            assert "totals" in result

    @pytest.mark.asyncio
    async def test_empty_data(self):
        from analytics import get_daily_metrics
        with patch("analytics.db") as mock_db:
            mock_db.users.aggregate.return_value.to_list = AsyncMock(return_value=[])
            mock_db.audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            result = await get_daily_metrics(days=1)
            assert result["totals"]["signups"] == 0
            assert result["totals"]["audits"] == 0
