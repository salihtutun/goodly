"""Unit tests for social_service.py - Social media auditor."""
import pytest
from unittest.mock import patch, AsyncMock

@pytest.fixture(autouse=True)
def mock_ask_json():
    with patch("social_service.ask_json", new_callable=AsyncMock) as mock:
        mock.return_value = {"overall_score": 70, "headline": "Good", "categories": {}, "issues": [], "quick_wins": []}
        yield mock

def test_audit_profile_returns_dict(mock_ask_json):
    from social_service import audit_profile
    import asyncio
    result = asyncio.run(audit_profile(platform="instagram", handle="testuser", bio="Test bio", niche="fashion"))
    assert isinstance(result, dict)
    assert "overall_score" in result

def test_audit_profile_prompt_contains_handle(mock_ask_json):
    from social_service import audit_profile
    import asyncio
    asyncio.run(audit_profile(platform="instagram", handle="myhandle", bio="bio", niche="niche"))
    prompt = mock_ask_json.call_args[0][0]
    assert "myhandle" in prompt
    assert "INSTAGRAM" in prompt

def test_audit_profile_tiktok(mock_ask_json):
    from social_service import audit_profile
    import asyncio
    asyncio.run(audit_profile(platform="tiktok", handle="ttuser", bio="bio", niche="niche"))
    prompt = mock_ask_json.call_args[0][0]
    assert "TIKTOK" in prompt

def test_audit_profile_youtube(mock_ask_json):
    from social_service import audit_profile
    import asyncio
    asyncio.run(audit_profile(platform="youtube", handle="ytuser", bio="bio", niche="niche"))
    prompt = mock_ask_json.call_args[0][0]
    assert "YOUTUBE" in prompt

def test_audit_profile_with_fetched_signals(mock_ask_json):
    from social_service import audit_profile
    import asyncio
    asyncio.run(audit_profile(platform="instagram", handle="test", bio="b", niche="n", fetched_signals={"fetched": True, "og_title": "Profile", "followers_estimate": "1K"}))
    prompt = mock_ask_json.call_args[0][0]
    assert "Profile" in prompt

def test_audit_profile_fetched_signals_none(mock_ask_json):
    from social_service import audit_profile
    import asyncio
    asyncio.run(audit_profile(platform="instagram", handle="test", bio="b", niche="n"))
    prompt = mock_ask_json.call_args[0][0]
    assert "fetched" not in prompt.lower() or "public signals" not in prompt.lower()

def test_suggestions_returns_dict(mock_ask_json):
    from social_service import suggestions
    import asyncio
    result = asyncio.run(suggestions(platform="instagram", handle="test", bio="b", niche="n"))
    assert isinstance(result, dict)

def test_suggestions_prompt_contains_inputs(mock_ask_json):
    from social_service import suggestions
    import asyncio
    asyncio.run(suggestions(platform="instagram", handle="myhandle", bio="my bio", niche="fashion", location="NYC", target_customer="women"))
    prompt = mock_ask_json.call_args[0][0]
    assert "myhandle" in prompt
    assert "my bio" in prompt
    assert "fashion" in prompt

def test_compare_competitors_returns_dict(mock_ask_json):
    from social_service import compare_competitors
    import asyncio
    result = asyncio.run(compare_competitors(platform="instagram", your_handle="me", your_niche="fashion", competitors=["@comp1", "@comp2"]))
    assert isinstance(result, dict)

def test_compare_competitors_prompt_contains_competitors(mock_ask_json):
    from social_service import compare_competitors
    import asyncio
    asyncio.run(compare_competitors(platform="instagram", your_handle="me", your_niche="fashion", competitors=["@a", "@b"]))
    prompt = mock_ask_json.call_args[0][0]
    assert "a" in prompt
    assert "b" in prompt

def test_system_constant():
    from social_service import SYSTEM
    assert "social media" in SYSTEM.lower()

def test_platform_hints_has_all_platforms():
    from social_service import PLATFORM_HINTS
    assert "instagram" in PLATFORM_HINTS
    assert "tiktok" in PLATFORM_HINTS
    assert "youtube" in PLATFORM_HINTS

def test_platform_hints_instagram_has_what_matters():
    from social_service import PLATFORM_HINTS
    assert "what_matters" in PLATFORM_HINTS["instagram"]
    assert len(PLATFORM_HINTS["instagram"]["what_matters"]) > 0
