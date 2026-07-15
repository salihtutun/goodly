"""Unit tests for product_analytics.py — event tracking, funnel, feature adoption, daily metrics, MRR."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class TestTrackEvent:
    """Tests for track_event()."""

    @pytest.mark.asyncio
    async def test_tracks_event_successfully(self):
        from product_analytics import track_event
        mock_db = MagicMock()
        mock_db.analytics_events = MagicMock()
        mock_db.analytics_events.insert_one = AsyncMock()
        await track_event(mock_db, event="page_view", user_id="user1", properties={"page": "/"}, session_id="sess1")
        mock_db.analytics_events.insert_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_swallows_errors(self):
        from product_analytics import track_event
        mock_db = MagicMock()
        mock_db.analytics_events = MagicMock()
        mock_db.analytics_events.insert_one = AsyncMock(side_effect=Exception("DB down"))
        await track_event(mock_db, event="page_view")
        # Should not raise

    @pytest.mark.asyncio
    async def test_defaults_for_optional_fields(self):
        from product_analytics import track_event
        mock_db = MagicMock()
        mock_db.analytics_events = MagicMock()
        mock_db.analytics_events.insert_one = AsyncMock()
        await track_event(mock_db, event="signup")
        call_args = mock_db.analytics_events.insert_one.call_args[0][0]
        assert call_args["event"] == "signup"
        assert call_args["user_id"] is None
        assert call_args["session_id"] is None
        assert call_args["properties"] == {}


class TestGetEventFunnelMetrics:
    """Tests for get_event_funnel_metrics()."""

    @pytest.mark.asyncio
    async def test_returns_funnel_data(self):
        from product_analytics import get_event_funnel_metrics
        mock_db = MagicMock()
        mock_db.analytics_events = MagicMock()
        mock_db.analytics_events.count_documents = AsyncMock(side_effect=[1000, 200, 50, 10])
        mock_db.analytics_events.aggregate = MagicMock()
        mock_db.analytics_events.aggregate.return_value.to_list = AsyncMock(return_value=[{"count": 45}])
        result = await get_event_funnel_metrics(mock_db, days=30)
        assert result["period_days"] == 30
        assert result["visitors"] == 1000
        assert result["audit_runs"] == 200
        assert result["signups"] == 50
        assert result["unique_signups"] == 45
        assert result["upgrades"] == 10
        assert "conversion_rates" in result

    @pytest.mark.asyncio
    async def test_zero_visitors(self):
        from product_analytics import get_event_funnel_metrics
        mock_db = MagicMock()
        mock_db.analytics_events = MagicMock()
        mock_db.analytics_events.count_documents = AsyncMock(return_value=0)
        mock_db.analytics_events.aggregate = MagicMock()
        mock_db.analytics_events.aggregate.return_value.to_list = AsyncMock(return_value=[])
        result = await get_event_funnel_metrics(mock_db, days=30)
        assert result["conversion_rates"]["visitor_to_audit"] == 0

    @pytest.mark.asyncio
    async def test_aggregate_error_handled(self):
        from product_analytics import get_event_funnel_metrics
        mock_db = MagicMock()
        mock_db.analytics_events = MagicMock()
        mock_db.analytics_events.count_documents = AsyncMock(return_value=100)
        mock_db.analytics_events.aggregate = MagicMock()
        mock_db.analytics_events.aggregate.return_value.to_list = AsyncMock(side_effect=Exception("aggregate error"))
        result = await get_event_funnel_metrics(mock_db, days=30)
        assert result["unique_signups"] == 0


class TestGetEventFeatureAdoption:
    """Tests for get_event_feature_adoption()."""

    @pytest.mark.asyncio
    async def test_returns_feature_usage(self):
        from product_analytics import get_event_feature_adoption
        mock_db = MagicMock()
        mock_db.analytics_events = MagicMock()
        mock_db.analytics_events.count_documents = AsyncMock(return_value=42)
        result = await get_event_feature_adoption(mock_db, days=30)
        assert result["period_days"] == 30
        assert "feature_usage" in result
        assert result["feature_usage"]["audit_run"] == 42


class TestGetEventDailyMetrics:
    """Tests for get_event_daily_metrics()."""

    @pytest.mark.asyncio
    async def test_returns_daily_data(self):
        from product_analytics import get_event_daily_metrics
        mock_db = MagicMock()
        mock_db.analytics_events = MagicMock()
        mock_db.analytics_events.aggregate = MagicMock()
        mock_db.analytics_events.aggregate.return_value.to_list = AsyncMock(return_value=[
            {"_id": {"date": "2024-01-15", "event": "page_view"}, "count": 100},
            {"_id": {"date": "2024-01-15", "event": "signup"}, "count": 5},
        ])
        result = await get_event_daily_metrics(mock_db, days=30)
        assert result["period_days"] == 30
        assert "2024-01-15" in result["daily"]
        assert result["daily"]["2024-01-15"]["page_view"] == 100

    @pytest.mark.asyncio
    async def test_aggregate_error_returns_empty(self):
        from product_analytics import get_event_daily_metrics
        mock_db = MagicMock()
        mock_db.analytics_events = MagicMock()
        mock_db.analytics_events.aggregate = MagicMock()
        mock_db.analytics_events.aggregate.return_value.to_list = AsyncMock(side_effect=Exception("fail"))
        result = await get_event_daily_metrics(mock_db, days=30)
        assert result["daily"] == {}


class TestGetMRREstimate:
    """Tests for get_mrr_estimate()."""

    @pytest.mark.asyncio
    async def test_calculates_mrr(self):
        from product_analytics import get_mrr_estimate
        mock_db = MagicMock()
        mock_db.users = MagicMock()
        mock_db.users.aggregate = MagicMock()
        mock_db.users.aggregate.return_value.to_list = AsyncMock(return_value=[
            {"_id": "free", "count": 50},
            {"_id": "pro", "count": 10},
        ])
        result = await get_mrr_estimate(mock_db)
        assert result["estimated_mrr"] == 10 * 149
        assert result["total_users"] == 60

    @pytest.mark.asyncio
    async def test_aggregate_error_returns_empty(self):
        from product_analytics import get_mrr_estimate
        mock_db = MagicMock()
        mock_db.users = MagicMock()
        mock_db.users.aggregate = MagicMock()
        mock_db.users.aggregate.return_value.to_list = AsyncMock(side_effect=Exception("fail"))
        result = await get_mrr_estimate(mock_db)
        assert result["estimated_mrr"] == 0
        assert result["total_users"] == 0


class TestBackCompatAliases:
    """Verify back-compat aliases point to the right functions."""

    def test_get_funnel_metrics_alias(self):
        from product_analytics import get_funnel_metrics, get_event_funnel_metrics
        assert get_funnel_metrics is get_event_funnel_metrics

    def test_get_feature_adoption_alias(self):
        from product_analytics import get_feature_adoption, get_event_feature_adoption
        assert get_feature_adoption is get_event_feature_adoption

    def test_get_daily_metrics_alias(self):
        from product_analytics import get_daily_metrics, get_event_daily_metrics
        assert get_daily_metrics is get_event_daily_metrics
