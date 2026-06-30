"""Unit tests for gbp_service.py - Google Business Profile auditor."""
import pytest
from unittest.mock import patch, AsyncMock

@pytest.fixture(autouse=True)
def mock_ask_json():
    with patch("gbp_service.ask_json", new_callable=AsyncMock) as mock:
        mock.return_value = {"overall_score": 75, "headline": "Good", "categories": {}, "issues": [], "quick_wins": []}
        yield mock

def test_audit_listing_returns_dict(mock_ask_json):
    from gbp_service import audit_listing
    import asyncio
    result = asyncio.run(audit_listing(business_name="Test Cafe", primary_category="Coffee Shop"))
    assert isinstance(result, dict)
    assert "overall_score" in result

def test_audit_listing_prompt_contains_business_name(mock_ask_json):
    from gbp_service import audit_listing
    import asyncio
    asyncio.run(audit_listing(business_name="Acme Cafe", primary_category="Coffee"))
    prompt = mock_ask_json.call_args[0][0]
    assert "Acme Cafe" in prompt
    assert "Coffee" in prompt

def test_audit_listing_with_all_fields(mock_ask_json):
    from gbp_service import audit_listing
    import asyncio
    asyncio.run(audit_listing(
        business_name="Test", primary_category="Shop", address="123 Main",
        description="Best shop", phone="555-1234", website="https://test.com",
        photo_count=20, reviews_count=50, avg_rating=4.5, response_rate="90%",
        posts_per_month=4, booking_enabled=True, messaging_enabled=True
    ))
    prompt = mock_ask_json.call_args[0][0]
    assert "123 Main" in prompt
    assert "Best shop" in prompt
    assert "20" in prompt

def test_audit_listing_none_values(mock_ask_json):
    from gbp_service import audit_listing
    import asyncio
    asyncio.run(audit_listing(business_name="Test", primary_category="Shop"))
    prompt = mock_ask_json.call_args[0][0]
    assert "(unknown)" in prompt or "(not provided)" in prompt

def test_suggestions_returns_dict(mock_ask_json):
    from gbp_service import suggestions
    import asyncio
    result = asyncio.run(suggestions(business_name="Test", primary_category="Shop"))
    assert isinstance(result, dict)

def test_suggestions_prompt_contains_inputs(mock_ask_json):
    from gbp_service import suggestions
    import asyncio
    asyncio.run(suggestions(business_name="Acme", primary_category="Cafe", location="Portland", target_customer="locals"))
    prompt = mock_ask_json.call_args[0][0]
    assert "Acme" in prompt
    assert "Cafe" in prompt
    assert "Portland" in prompt

def test_compare_competitors_returns_dict(mock_ask_json):
    from gbp_service import compare_competitors
    import asyncio
    result = asyncio.run(compare_competitors(business_name="Test", primary_category="Shop", competitors=["A", "B"]))
    assert isinstance(result, dict)

def test_compare_competitors_prompt_contains_competitors(mock_ask_json):
    from gbp_service import compare_competitors
    import asyncio
    asyncio.run(compare_competitors(business_name="Test", primary_category="Shop", competitors=["Starbucks", "Blue Bottle"]))
    prompt = mock_ask_json.call_args[0][0]
    assert "Starbucks" in prompt
    assert "Blue Bottle" in prompt

def test_system_constant():
    from gbp_service import SYSTEM
    assert "Google Business Profile" in SYSTEM or "local-SEO" in SYSTEM

def test_best_practices_list():
    from gbp_service import GBP_BEST_PRACTICES
    assert len(GBP_BEST_PRACTICES) > 5
    assert any("category" in bp.lower() for bp in GBP_BEST_PRACTICES)
