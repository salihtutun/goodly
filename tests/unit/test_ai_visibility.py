"""Unit tests for ai_visibility.py - AI assistant visibility simulation."""
import pytest
from unittest.mock import patch, AsyncMock

@pytest.fixture(autouse=True)
def mock_ask_json():
    with patch("ai_visibility.ask_json", new_callable=AsyncMock) as mock:
        mock.return_value = {"overall_visibility_score": 45, "per_assistant": []}
        yield mock

def test_check_ai_visibility_returns_dict(mock_ask_json):
    from ai_visibility import check_ai_visibility
    import asyncio
    result = asyncio.run(check_ai_visibility(business_name="Test Cafe", category="Coffee Shop"))
    assert isinstance(result, dict)
    assert "overall_visibility_score" in result

def test_check_ai_visibility_with_location(mock_ask_json):
    from ai_visibility import check_ai_visibility
    import asyncio
    asyncio.run(check_ai_visibility(business_name="Test", category="Shop", location="Portland"))
    prompt = mock_ask_json.call_args[0][0]
    assert "Portland" in prompt

def test_check_ai_visibility_with_website(mock_ask_json):
    from ai_visibility import check_ai_visibility
    import asyncio
    asyncio.run(check_ai_visibility(business_name="Test", category="Shop", website="https://test.com"))
    prompt = mock_ask_json.call_args[0][0]
    assert "test.com" in prompt

def test_check_ai_visibility_with_custom_queries(mock_ask_json):
    from ai_visibility import check_ai_visibility
    import asyncio
    asyncio.run(check_ai_visibility(business_name="Test", category="Shop", queries=["best shop", "top shop"]))
    prompt = mock_ask_json.call_args[0][0]
    assert "best shop" in prompt
    assert "top shop" in prompt

def test_check_ai_visibility_generates_default_queries(mock_ask_json):
    from ai_visibility import check_ai_visibility
    import asyncio
    asyncio.run(check_ai_visibility(business_name="Test", category="Coffee"))
    prompt = mock_ask_json.call_args[0][0]
    assert "Coffee" in prompt

def test_check_ai_visibility_uses_pro_model(mock_ask_json):
    from ai_visibility import check_ai_visibility
    import asyncio
    asyncio.run(check_ai_visibility(business_name="Test", category="Shop"))
    call_kwargs = mock_ask_json.call_args[1]
    assert "model" in call_kwargs

def test_system_constant():
    from ai_visibility import SYSTEM
    assert "simulating" in SYSTEM.lower() or "AI" in SYSTEM

def test_assistants_list():
    from ai_visibility import ASSISTANTS
    assert "ChatGPT" in ASSISTANTS
    assert "Claude" in ASSISTANTS
    assert len(ASSISTANTS) == 4
