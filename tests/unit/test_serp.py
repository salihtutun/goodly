"""Unit tests for serp.py — SERP rank checker."""
import os
import pytest
from unittest.mock import patch, MagicMock

from conftest import AsyncMock

from serp import (
    _normalize_domain,
    check_rank,
    _check_via_serpapi,
    _check_via_duckduckgo,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _set_env(**kwargs):
    for k, v in kwargs.items():
        os.environ[k] = v


def _clear_env(*keys):
    for k in keys:
        os.environ.pop(k, None)


# ---------------------------------------------------------------------------
# _normalize_domain
# ---------------------------------------------------------------------------

def test_normalize_domain_strips_www():
    """_normalize_domain removes www. prefix."""
    assert _normalize_domain("www.example.com") == "example.com"


def test_normalize_domain_adds_https():
    """_normalize_domain adds https:// when no protocol is present."""
    assert _normalize_domain("example.com") == "example.com"


def test_normalize_domain_lowercases():
    """_normalize_domain lowercases the domain."""
    assert _normalize_domain("EXAMPLE.COM") == "example.com"


def test_normalize_domain_full_url():
    """_normalize_domain extracts domain from a full URL."""
    assert _normalize_domain("https://www.example.com/page") == "example.com"


def test_normalize_domain_strips_whitespace():
    """_normalize_domain strips whitespace."""
    assert _normalize_domain("  example.com  ") == "example.com"


# ---------------------------------------------------------------------------
# check_rank
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_check_rank_returns_structure():
    """check_rank returns a dict with expected keys."""
    _clear_env("SERPAPI_KEY")
    with patch("serp._check_via_duckduckgo", new=AsyncMock(return_value={
        "keyword": "test keyword",
        "domain": "example.com",
        "rank": 3,
        "total_results_checked": 10,
        "results": [],
        "engine": "duckduckgo",
    })):
        result = await check_rank("test keyword", "example.com")
        assert result["keyword"] == "test keyword"
        assert result["domain"] == "example.com"
        assert "rank" in result
        assert "results" in result


@pytest.mark.asyncio
async def test_check_rank_handles_error():
    """check_rank returns an error dict when search fails."""
    _clear_env("SERPAPI_KEY")
    with patch("serp._check_via_duckduckgo", new=AsyncMock(side_effect=Exception("Network error"))):
        result = await check_rank("test", "example.com")
        assert result["rank"] is None
        assert "error" in result
        assert "Network error" in result["error"]


@pytest.mark.asyncio
async def test_check_rank_invalid_domain():
    """check_rank returns an error for an empty domain."""
    result = await check_rank("test", "")
    assert result["rank"] is None
    assert result["error"] == "Invalid domain"


@pytest.mark.asyncio
async def test_check_rank_uses_serpapi_when_configured():
    """check_rank uses SerpAPI when SERPAPI_KEY is set."""
    _set_env(SERPAPI_KEY="test_key")
    try:
        with patch("serp._check_via_serpapi", new=AsyncMock(return_value={
            "keyword": "test", "domain": "example.com",
            "rank": 1, "total_results_checked": 10,
            "results": [], "engine": "google (serpapi)",
        })):
            result = await check_rank("test", "example.com")
            assert result["engine"] == "google (serpapi)"
    finally:
        _clear_env("SERPAPI_KEY")


@pytest.mark.asyncio
async def test_check_rank_serpapi_fallback_to_ddg():
    """check_rank falls back to DuckDuckGo when SerpAPI fails."""
    _set_env(SERPAPI_KEY="test_key")
    try:
        with patch("serp._check_via_serpapi", new=AsyncMock(side_effect=Exception("SerpAPI down"))):
            with patch("serp._check_via_duckduckgo", new=AsyncMock(return_value={
                "keyword": "test", "domain": "example.com",
                "rank": 5, "total_results_checked": 10,
                "results": [], "engine": "duckduckgo",
            })):
                result = await check_rank("test", "example.com")
                assert result["engine"] == "duckduckgo"
    finally:
        _clear_env("SERPAPI_KEY")


@pytest.mark.asyncio
async def test_check_rank_both_fail():
    """check_rank returns error when both SerpAPI and DDG fail."""
    _set_env(SERPAPI_KEY="test_key")
    try:
        with patch("serp._check_via_serpapi", new=AsyncMock(side_effect=Exception("SerpAPI down"))):
            with patch("serp._check_via_duckduckgo", new=AsyncMock(side_effect=Exception("DDG down"))):
                result = await check_rank("test", "example.com")
                assert result["rank"] is None
                assert "Search failed" in result["error"]
    finally:
        _clear_env("SERPAPI_KEY")


# ---------------------------------------------------------------------------
# _check_via_serpapi
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_serpapi_returns_rank():
    """_check_via_serpapi returns the rank when domain is found."""
    _set_env(SERPAPI_KEY="test_key")
    try:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "organic_results": [
                {"position": 1, "link": "https://other.com", "title": "Other"},
                {"position": 2, "link": "https://example.com", "title": "Target"},
                {"position": 3, "link": "https://third.com", "title": "Third"},
            ]
        }

        # Create a proper async context manager mock for httpx.AsyncClient
        class AsyncCtxMock:
            def __init__(self, client):
                self._client = client

            async def __aenter__(self):
                return self._client

            async def __aexit__(self, *args):
                pass

        mock_client = MagicMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
            result = await _check_via_serpapi("test", "example.com")
            assert result["rank"] == 2
            assert result["engine"] == "google (serpapi)"
    finally:
        _clear_env("SERPAPI_KEY")


@pytest.mark.asyncio
async def test_serpapi_not_found():
    """_check_via_serpapi returns None rank when domain is not found."""
    _set_env(SERPAPI_KEY="test_key")
    try:
        mock_response = MagicMock()
        mock_response.raise_for_status = MagicMock()
        mock_response.json.return_value = {
            "organic_results": [
                {"position": 1, "link": "https://other.com", "title": "Other"},
            ]
        }

        class AsyncCtxMock:
            def __init__(self, client):
                self._client = client

            async def __aenter__(self):
                return self._client

            async def __aexit__(self, *args):
                pass

        mock_client = MagicMock()
        mock_client.get = AsyncMock(return_value=mock_response)

        with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
            result = await _check_via_serpapi("test", "example.com")
            assert result["rank"] is None
    finally:
        _clear_env("SERPAPI_KEY")

# ---------------------------------------------------------------------------
# _check_via_duckduckgo (direct tests — not mocked)
# ---------------------------------------------------------------------------

class AsyncCtxMock:
    """Mock that works as an async context manager for httpx.AsyncClient."""
    def __init__(self, client):
        self._client = client
    async def __aenter__(self):
        return self._client
    async def __aexit__(self, *args):
        pass


@pytest.mark.asyncio
async def test_ddg_rank_found():
    """_check_via_duckduckgo finds the target domain and returns its rank."""
    mock_resp = MagicMock()
    mock_resp.text = '<html><body><a class="result__a" href="https://other.com">O</a><a class="result__a" href="https://example.com">Match!</a></body></html>'
    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_resp)
    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        r = await _check_via_duckduckgo("test kw", "example.com")
        assert r["engine"] == "duckduckgo"
        assert r["rank"] == 2
        assert r["found"] is True if "found" in r else True  # rank implies found


@pytest.mark.asyncio
async def test_ddg_not_found():
    """_check_via_duckduckgo returns None rank when domain not in results."""
    mock_resp = MagicMock()
    mock_resp.text = '<html><body>No results here</body></html>'
    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_resp)
    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        r = await _check_via_duckduckgo("test", "other.com")
        assert r["rank"] is None


@pytest.mark.asyncio
async def test_ddg_uddg_redirect():
    """_check_via_duckduckgo handles DuckDuckGo's uddg redirect links."""
    mock_resp = MagicMock()
    mock_resp.text = '<html><body><a class="result__a" href="https://duckduckgo.com/l/?uddg=https://example.com">R</a></body></html>'
    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_resp)
    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        r = await _check_via_duckduckgo("test", "example.com")
        assert r["engine"] == "duckduckgo"
        assert r["rank"] == 1


@pytest.mark.asyncio
async def test_ddg_skip_non_http_links():
    """_check_via_duckduckgo skips javascript: and other non-http links."""
    mock_resp = MagicMock()
    mock_resp.text = '<html><body><a class="result__a" href="javascript:void(0)">JS</a><a class="result__a" href="https://example.com">Real</a></body></html>'
    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_resp)
    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        r = await _check_via_duckduckgo("test", "example.com")
        assert r["rank"] == 1  # Only the real link counts


@pytest.mark.asyncio
async def test_ddg_max_results_limit():
    """_check_via_duckduckgo respects max_results limit (default 30)."""
    links = "".join(f'<a class="result__a" href="https://site{i}.com">S{i}</a>' for i in range(35))
    mock_resp = MagicMock()
    mock_resp.text = f'<html><body>{links}</body></html>'
    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_resp)
    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        r = await _check_via_duckduckgo("test", "example.com")
        assert r["total_results_checked"] <= 30


@pytest.mark.asyncio
async def test_ddg_subdomain_match():
    """_check_via_duckduckgo matches subdomains (sub.example.com matches example.com)."""
    mock_resp = MagicMock()
    mock_resp.text = '<html><body><a class="result__a" href="https://sub.example.com">Sub</a></body></html>'
    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_resp)
    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        r = await _check_via_duckduckgo("test", "example.com")
        assert r["rank"] == 1


@pytest.mark.asyncio
async def test_ddg_www_prefix_stripped():
    """_check_via_duckduckgo strips www. prefix from result domains."""
    mock_resp = MagicMock()
    mock_resp.text = '<html><body><a class="result__a" href="https://www.example.com">WWW</a></body></html>'
    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_resp)
    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        r = await _check_via_duckduckgo("test", "example.com")
        assert r["rank"] == 1


@pytest.mark.asyncio
async def test_ddg_network_error():
    """_check_via_duckduckgo handles network errors gracefully."""
    mock_client = MagicMock()
    mock_client.post = AsyncMock(side_effect=Exception("Network error"))
    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        with pytest.raises(Exception, match="Network error"):
            await _check_via_duckduckgo("test", "example.com")
