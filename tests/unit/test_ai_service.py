"""Unit tests for ai_service.py - SEO AI tools."""
import pytest
from unittest.mock import patch, AsyncMock

@pytest.fixture(autouse=True)
def mock_ask_json():
    with patch("ai_service.ask_json", new_callable=AsyncMock) as mock:
        mock.return_value = {"test": "ok"}
        yield mock

def test_generate_meta_tags_returns_dict(mock_ask_json):
    from ai_service import generate_meta_tags
    import asyncio
    result = asyncio.run(generate_meta_tags("Test Biz", "We sell stuff", "keywords"))
    assert isinstance(result, dict)
    mock_ask_json.assert_called_once()

def test_generate_meta_tags_prompt_contains_business_name(mock_ask_json):
    from ai_service import generate_meta_tags
    import asyncio
    asyncio.run(generate_meta_tags("Acme Corp", "Widgets", "blue widgets"))
    prompt = mock_ask_json.call_args[0][0]
    assert "Acme Corp" in prompt
    assert "Widgets" in prompt
    assert "blue widgets" in prompt

def test_generate_meta_tags_empty_keywords(mock_ask_json):
    from ai_service import generate_meta_tags
    import asyncio
    asyncio.run(generate_meta_tags("Biz", "Stuff"))
    prompt = mock_ask_json.call_args[0][0]
    assert "infer" in prompt.lower()

def test_keyword_research_returns_dict(mock_ask_json):
    from ai_service import keyword_research
    import asyncio
    result = asyncio.run(keyword_research("coffee shop", "food", "Portland"))
    assert isinstance(result, dict)
    mock_ask_json.assert_called_once()

def test_keyword_research_prompt_contains_inputs(mock_ask_json):
    from ai_service import keyword_research
    import asyncio
    asyncio.run(keyword_research("coffee", "food", "Portland"))
    prompt = mock_ask_json.call_args[0][0]
    assert "coffee" in prompt
    assert "food" in prompt
    assert "Portland" in prompt

def test_keyword_research_empty_optional(mock_ask_json):
    from ai_service import keyword_research
    import asyncio
    asyncio.run(keyword_research("topic"))
    prompt = mock_ask_json.call_args[0][0]
    assert "topic" in prompt

def test_competitor_analysis_returns_dict(mock_ask_json):
    from ai_service import competitor_analysis
    import asyncio
    result = asyncio.run(competitor_analysis("mysite.com", ["comp1.com", "comp2.com"], "tech"))
    assert isinstance(result, dict)

def test_competitor_analysis_prompt_contains_competitors(mock_ask_json):
    from ai_service import competitor_analysis
    import asyncio
    asyncio.run(competitor_analysis("me.com", ["a.com", "b.com"]))
    prompt = mock_ask_json.call_args[0][0]
    assert "me.com" in prompt
    assert "a.com" in prompt
    assert "b.com" in prompt

def test_competitor_analysis_empty_competitors(mock_ask_json):
    from ai_service import competitor_analysis
    import asyncio
    asyncio.run(competitor_analysis("me.com", []))
    prompt = mock_ask_json.call_args[0][0]
    assert "me.com" in prompt

def test_audit_recommendations_returns_dict(mock_ask_json):
    from ai_service import audit_recommendations
    import asyncio
    audit = {"url": "https://test.com", "overall_score": 75, "categories": {}, "issues": []}
    result = asyncio.run(audit_recommendations(audit))
    assert isinstance(result, dict)

def test_audit_recommendations_prompt_contains_score(mock_ask_json):
    from ai_service import audit_recommendations
    import asyncio
    audit = {"url": "https://test.com", "overall_score": 75, "categories": {"seo": 80}, "issues": [{"msg": "fix"}]}
    asyncio.run(audit_recommendations(audit))
    prompt = mock_ask_json.call_args[0][0]
    assert "75" in prompt

def test_audit_recommendations_handles_missing_fields(mock_ask_json):
    from ai_service import audit_recommendations
    import asyncio
    asyncio.run(audit_recommendations({"url": "https://test.com"}))
    prompt = mock_ask_json.call_args[0][0]
    assert "test.com" in prompt

def test_system_message_constant():
    from ai_service import SYSTEM_MESSAGE
    assert "SEO" in SYSTEM_MESSAGE
    assert "JSON" in SYSTEM_MESSAGE
