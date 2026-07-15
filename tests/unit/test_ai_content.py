"""Unit tests for ai_content.py — blog posts, review responses, FAQ, website copy, email, social captions."""
import pytest
from unittest.mock import AsyncMock, patch


@pytest.fixture(autouse=True)
def mock_ask_json():
    with patch("ai_content.ask_json") as mock:
        mock.return_value = {"result": "ok"}
        yield mock


class TestGenerateBlogPost:
    @pytest.mark.asyncio
    async def test_calls_ask_json(self, mock_ask_json):
        from ai_content import generate_blog_post
        result = await generate_blog_post(business_name="Test Biz", topic="SEO Tips", keywords="seo, tips", tone="friendly")
        assert result == {"result": "ok"}
        mock_ask_json.assert_called_once()
        call_args = mock_ask_json.call_args[0][0]
        assert "Test Biz" in call_args
        assert "SEO Tips" in call_args

    @pytest.mark.asyncio
    async def test_default_keywords(self, mock_ask_json):
        from ai_content import generate_blog_post
        await generate_blog_post(business_name="Biz", topic="Topic")
        call_args = mock_ask_json.call_args[0][0]
        assert "infer the best ones" in call_args


class TestGenerateReviewResponse:
    @pytest.mark.asyncio
    async def test_positive_review(self, mock_ask_json):
        from ai_content import generate_review_response
        result = await generate_review_response(
            business_name="Cafe", reviewer_name="Alice", rating=5,
            review_text="Great coffee!", tone="warm"
        )
        assert result == {"result": "ok"}
        call_args = mock_ask_json.call_args[0][0]
        assert "Cafe" in call_args
        assert "Alice" in call_args
        assert "★★★★★" in call_args

    @pytest.mark.asyncio
    async def test_negative_review(self, mock_ask_json):
        from ai_content import generate_review_response
        await generate_review_response(
            business_name="Shop", reviewer_name="Bob", rating=2,
            review_text="Bad service"
        )
        call_args = mock_ask_json.call_args[0][0]
        assert "★★☆☆☆" in call_args


class TestGenerateFaq:
    @pytest.mark.asyncio
    async def test_with_location(self, mock_ask_json):
        from ai_content import generate_faq
        result = await generate_faq(business_name="Plumber Inc", category="plumbing", location="Austin", services="repairs")
        assert result == {"result": "ok"}
        call_args = mock_ask_json.call_args[0][0]
        assert "Plumber Inc" in call_args
        assert "Austin" in call_args

    @pytest.mark.asyncio
    async def test_without_location(self, mock_ask_json):
        from ai_content import generate_faq
        await generate_faq(business_name="Biz", category="retail")
        call_args = mock_ask_json.call_args[0][0]
        assert "not specified" in call_args


class TestGenerateWebsiteCopy:
    @pytest.mark.asyncio
    async def test_homepage(self, mock_ask_json):
        from ai_content import generate_website_copy
        result = await generate_website_copy(
            business_name="Store", description="Online shop", page_type="homepage",
            keywords="shop", location="NYC"
        )
        assert result == {"result": "ok"}
        call_args = mock_ask_json.call_args[0][0]
        assert "Store" in call_args
        assert "homepage" in call_args

    @pytest.mark.asyncio
    async def test_unknown_page_type_defaults(self, mock_ask_json):
        from ai_content import generate_website_copy
        await generate_website_copy(business_name="Biz", description="desc", page_type="unknown")
        call_args = mock_ask_json.call_args[0][0]
        assert "Hero headline" in call_args  # defaults to homepage hint text


class TestGenerateEmail:
    @pytest.mark.asyncio
    async def test_welcome_email(self, mock_ask_json):
        from ai_content import generate_email
        result = await generate_email(business_name="Biz", email_type="welcome", topic="Welcome!", tone="warm")
        assert result == {"result": "ok"}
        call_args = mock_ask_json.call_args[0][0]
        assert "Biz" in call_args
        assert "welcome" in call_args

    @pytest.mark.asyncio
    async def test_unknown_type_defaults(self, mock_ask_json):
        from ai_content import generate_email
        await generate_email(business_name="Biz", email_type="unknown")
        call_args = mock_ask_json.call_args[0][0]
        assert "Promotional email" in call_args  # defaults to promo hint


class TestGenerateSocialCaptions:
    @pytest.mark.asyncio
    async def test_instagram(self, mock_ask_json):
        from ai_content import generate_social_captions
        result = await generate_social_captions(
            business_name="Cafe", platform="instagram", topic="New menu", tone="fun"
        )
        assert result == {"result": "ok"}
        call_args = mock_ask_json.call_args[0][0]
        assert "Cafe" in call_args
        assert "instagram" in call_args

    @pytest.mark.asyncio
    async def test_unknown_platform_defaults(self, mock_ask_json):
        from ai_content import generate_social_captions
        await generate_social_captions(business_name="Biz", platform="unknown", topic="test")
        call_args = mock_ask_json.call_args[0][0]
        assert "Visual-first" in call_args  # defaults to instagram hint
