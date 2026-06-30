"""Unit tests for social_fetcher.py — social profile fetcher."""
import pytest
from unittest.mock import patch, MagicMock

from conftest import AsyncMock

from social_fetcher import (
    _strip_handle,
    _parse_followers,
    fetch_profile_signals,
)


# ---------------------------------------------------------------------------
# _strip_handle
# ---------------------------------------------------------------------------

def test_strip_handle_removes_at():
    """_strip_handle removes the leading @ symbol."""
    assert _strip_handle("@username") == "username"


def test_strip_handle_removes_trailing_slash():
    """_strip_handle removes trailing path segments."""
    assert _strip_handle("username/") == "username"


def test_strip_handle_removes_path():
    """_strip_handle removes everything after a slash."""
    assert _strip_handle("@user/path/extra") == "user"


def test_strip_handle_strips_whitespace():
    """_strip_handle strips whitespace."""
    assert _strip_handle("  @user  ") == "user"


def test_strip_handle_none():
    """_strip_handle returns empty string for None."""
    assert _strip_handle(None) == ""


def test_strip_handle_empty():
    """_strip_handle returns empty string for empty input."""
    assert _strip_handle("") == ""


# ---------------------------------------------------------------------------
# _parse_followers
# ---------------------------------------------------------------------------

def test_parse_followers_extracts_number():
    """_parse_followers extracts follower count from text."""
    assert _parse_followers("1,234 Followers") == "1,234"


def test_parse_followers_extracts_k():
    """_parse_followers extracts K-suffixed counts."""
    assert _parse_followers("12.5K Followers") == "12.5K"


def test_parse_followers_extracts_m():
    """_parse_followers extracts M-suffixed counts."""
    assert _parse_followers("2.3M followers") == "2.3M"


def test_parse_followers_no_match():
    """_parse_followers returns None when no follower count is found."""
    assert _parse_followers("Just some random text") is None


def test_parse_followers_none():
    """_parse_followers returns None for None input."""
    assert _parse_followers(None) is None


def test_parse_followers_empty():
    """_parse_followers returns None for empty string."""
    assert _parse_followers("") is None


# ---------------------------------------------------------------------------
# fetch_profile_signals
# ---------------------------------------------------------------------------

class AsyncCtxMock:
    """A proper async context manager mock for httpx.AsyncClient."""
    def __init__(self, client):
        self._client = client

    async def __aenter__(self):
        return self._client

    async def __aexit__(self, *args):
        pass


@pytest.mark.asyncio
async def test_fetch_profile_signals_returns_dict():
    """fetch_profile_signals returns a dict with expected keys."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "<html><head><title>@testuser • Instagram</title><meta property='og:description' content='1,234 Followers'></head></html>"

    mock_client = MagicMock()
    mock_client.get = AsyncMock(return_value=mock_response)

    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        result = await fetch_profile_signals("instagram", "testuser")
        assert result["fetched"] is True
        assert "url" in result
        assert "followers_estimate" in result


@pytest.mark.asyncio
async def test_fetch_profile_signals_empty_handle():
    """fetch_profile_signals returns error for empty handle."""
    result = await fetch_profile_signals("instagram", "")
    assert result["fetched"] is False
    assert result["reason"] == "Empty handle"


@pytest.mark.asyncio
async def test_fetch_profile_signals_unknown_platform():
    """fetch_profile_signals returns error for unknown platform."""
    result = await fetch_profile_signals("twitter", "user")
    assert result["fetched"] is False
    assert result["reason"] == "Unknown platform"


@pytest.mark.asyncio
async def test_fetch_profile_signals_network_error():
    """fetch_profile_signals handles network errors gracefully."""
    mock_client = MagicMock()
    mock_client.get = AsyncMock(side_effect=Exception("Connection timeout"))

    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        result = await fetch_profile_signals("instagram", "user")
        assert result["fetched"] is False
        assert "Network error" in result["reason"]


@pytest.mark.asyncio
async def test_fetch_profile_signals_404():
    """fetch_profile_signals returns error for 404 status."""
    mock_response = MagicMock()
    mock_response.status_code = 404
    mock_response.text = ""

    mock_client = MagicMock()
    mock_client.get = AsyncMock(return_value=mock_response)

    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        result = await fetch_profile_signals("instagram", "nonexistent")
        assert result["fetched"] is False
        assert result["status"] == 404


@pytest.mark.asyncio
async def test_fetch_profile_signals_tiktok_url():
    """fetch_profile_signals constructs correct TikTok URL."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "<html><head><title>TikTok</title></head></html>"

    mock_client = MagicMock()
    mock_client.get = AsyncMock(return_value=mock_response)

    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        result = await fetch_profile_signals("tiktok", "creator")
        assert result["fetched"] is True
        assert "tiktok.com/@creator" in result["url"]


@pytest.mark.asyncio
async def test_fetch_profile_signals_youtube_url():
    """fetch_profile_signals constructs correct YouTube URL."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "<html><head><title>YouTube</title></head></html>"

    mock_client = MagicMock()
    mock_client.get = AsyncMock(return_value=mock_response)

    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        result = await fetch_profile_signals("youtube", "channel")
        assert result["fetched"] is True
        assert "youtube.com/@channel" in result["url"]


@pytest.mark.asyncio
async def test_fetch_profile_signals_strips_at_handle():
    """fetch_profile_signals strips @ from the handle."""
    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.text = "<html><head><title>Instagram</title></head></html>"

    mock_client = MagicMock()
    mock_client.get = AsyncMock(return_value=mock_response)

    with patch("httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        result = await fetch_profile_signals("instagram", "@user")
        assert result["fetched"] is True
        assert "instagram.com/user/" in result["url"]
