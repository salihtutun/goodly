"""Unit tests for gsc_service.py — Google Search Console integration."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class TestGetCredentials:
    """Tests for _get_credentials()."""

    def test_no_env_var_returns_none(self):
        import gsc_service
        gsc_service._credentials = None
        with patch("os.environ.get", return_value=None):
            result = gsc_service._get_credentials()
            assert result is None

    def test_returns_cached_credentials(self):
        import gsc_service
        gsc_service._credentials = "cached_creds"
        result = gsc_service._get_credentials()
        assert result == "cached_creds"
        gsc_service._credentials = None

    def test_invalid_base64_returns_none(self):
        import gsc_service
        gsc_service._credentials = None
        with patch("os.environ.get", return_value="not-valid-base64!!!"):
            result = gsc_service._get_credentials()
            assert result is None


class TestIsConfigured:
    """Tests for is_configured()."""

    def test_not_configured(self):
        import gsc_service
        gsc_service._credentials = None
        with patch("os.environ.get", return_value=None):
            assert gsc_service.is_configured() is False

    def test_configured(self):
        import gsc_service
        gsc_service._credentials = "some_creds"
        assert gsc_service.is_configured() is True
        gsc_service._credentials = None


class TestFetchSearchAnalytics:
    """Tests for fetch_search_analytics()."""

    @pytest.mark.asyncio
    async def test_not_configured_returns_error(self):
        import gsc_service
        gsc_service._credentials = None
        with patch("os.environ.get", return_value=None):
            result = await gsc_service.fetch_search_analytics("https://example.com")
            assert "error" in result
            assert result["rows"] == []

    @pytest.mark.asyncio
    async def test_returns_formatted_data(self):
        import gsc_service
        gsc_service._credentials = "fake_creds"
        with patch("gsc_service.asyncio.to_thread") as mock_thread:
            mock_thread.return_value = {
                "rows": [
                    {"keys": ["query1"], "clicks": 100, "impressions": 1000, "ctr": 0.1, "position": 3.5},
                    {"keys": ["query2"], "clicks": 50, "impressions": 500, "ctr": 0.1, "position": 5.0},
                ]
            }
            result = await gsc_service.fetch_search_analytics("https://example.com", days=28)
            assert len(result["rows"]) == 2
            assert result["rows"][0]["clicks"] == 100
            assert result["rows"][0]["ctr"] == 10.0
            assert result["summary"]["total_clicks"] == 150
            assert result["summary"]["total_impressions"] == 1500

    @pytest.mark.asyncio
    async def test_empty_results(self):
        import gsc_service
        gsc_service._credentials = "fake_creds"
        with patch("gsc_service.asyncio.to_thread") as mock_thread:
            mock_thread.return_value = {"rows": []}
            result = await gsc_service.fetch_search_analytics("https://example.com")
            assert result["rows"] == []
            assert result["summary"]["total_clicks"] == 0

    @pytest.mark.asyncio
    async def test_api_error_handled(self):
        import gsc_service
        gsc_service._credentials = "fake_creds"
        with patch("gsc_service.asyncio.to_thread") as mock_thread:
            mock_thread.side_effect = Exception("API error")
            result = await gsc_service.fetch_search_analytics("https://example.com")
            assert "error" in result
            assert result["rows"] == []


class TestListSites:
    """Tests for list_sites()."""

    @pytest.mark.asyncio
    async def test_not_configured_returns_empty(self):
        import gsc_service
        gsc_service._credentials = None
        with patch("os.environ.get", return_value=None):
            result = await gsc_service.list_sites()
            assert result == []

    @pytest.mark.asyncio
    async def test_returns_sites(self):
        import gsc_service
        gsc_service._credentials = "fake_creds"
        with patch("gsc_service.asyncio.to_thread") as mock_thread:
            mock_thread.return_value = {"siteEntry": [
                {"siteUrl": "https://example.com", "permissionLevel": "siteOwner"},
            ]}
            result = await gsc_service.list_sites()
            assert len(result) == 1
            assert result[0]["siteUrl"] == "https://example.com"

    @pytest.mark.asyncio
    async def test_api_error_returns_empty(self):
        import gsc_service
        gsc_service._credentials = "fake_creds"
        with patch("gsc_service.asyncio.to_thread") as mock_thread:
            mock_thread.side_effect = Exception("API error")
            result = await gsc_service.list_sites()
            assert result == []


class TestGetTopQueries:
    """Tests for get_top_queries()."""

    @pytest.mark.asyncio
    async def test_delegates_to_fetch(self):
        import gsc_service
        gsc_service._credentials = "fake_creds"
        with patch("gsc_service.asyncio.to_thread") as mock_thread:
            mock_thread.return_value = {"rows": [{"keys": ["q1"], "clicks": 10, "impressions": 100, "ctr": 0.1, "position": 2.0}]}
            result = await gsc_service.get_top_queries("https://example.com", days=28, limit=10)
            assert len(result["rows"]) == 1


class TestGetTopPages:
    """Tests for get_top_pages()."""

    @pytest.mark.asyncio
    async def test_delegates_to_fetch(self):
        import gsc_service
        gsc_service._credentials = "fake_creds"
        with patch("gsc_service.asyncio.to_thread") as mock_thread:
            mock_thread.return_value = {"rows": [{"keys": ["/page1"], "clicks": 20, "impressions": 200, "ctr": 0.1, "position": 1.5}]}
            result = await gsc_service.get_top_pages("https://example.com", days=28, limit=10)
            assert len(result["rows"]) == 1


class TestGetPerformanceTrend:
    """Tests for get_performance_trend()."""

    @pytest.mark.asyncio
    async def test_not_configured_returns_error(self):
        import gsc_service
        gsc_service._credentials = None
        with patch("os.environ.get", return_value=None):
            result = await gsc_service.get_performance_trend("https://example.com")
            assert "error" in result
            assert result["daily"] == []

    @pytest.mark.asyncio
    async def test_returns_daily_trend(self):
        import gsc_service
        gsc_service._credentials = "fake_creds"
        with patch("gsc_service.asyncio.to_thread") as mock_thread:
            mock_thread.return_value = {
                "rows": [
                    {"keys": ["2024-01-15"], "clicks": 50, "impressions": 500, "ctr": 0.1, "position": 3.0},
                    {"keys": ["2024-01-16"], "clicks": 55, "impressions": 520, "ctr": 0.106, "position": 2.8},
                ]
            }
            result = await gsc_service.get_performance_trend("https://example.com", days=90)
            assert len(result["daily"]) == 2
            assert result["daily"][0]["date"] == "2024-01-15"

    @pytest.mark.asyncio
    async def test_api_error_handled(self):
        import gsc_service
        gsc_service._credentials = "fake_creds"
        with patch("gsc_service.asyncio.to_thread") as mock_thread:
            mock_thread.side_effect = Exception("API error")
            result = await gsc_service.get_performance_trend("https://example.com")
            assert "error" in result
            assert result["daily"] == []
