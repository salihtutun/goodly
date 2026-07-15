"""Unit tests for ai_strategy.py — content strategy, repurposing, image prompts, industry packs."""
import pytest
from unittest.mock import AsyncMock, patch


@pytest.fixture(autouse=True)
def mock_ask_json():
    with patch("ai_strategy.ask_json") as mock:
        mock.return_value = {"result": "ok"}
        yield mock


class TestGenerateContentStrategy:
    @pytest.mark.asyncio
    async def test_calls_ask_json(self, mock_ask_json):
        from ai_strategy import generate_content_strategy
        result = await generate_content_strategy(
            business_name="Biz", industry="retail", location="NYC",
            target_audience="shoppers", goals="more sales", competitors="CompX"
        )
        assert result == {"result": "ok"}
        call_args = mock_ask_json.call_args[0][0]
        assert "Biz" in call_args
        assert "retail" in call_args
        assert "NYC" in call_args

    @pytest.mark.asyncio
    async def test_default_values(self, mock_ask_json):
        from ai_strategy import generate_content_strategy
        await generate_content_strategy(business_name="Biz", industry="retail")
        call_args = mock_ask_json.call_args[0][0]
        assert "Online/national" in call_args
        assert "Not specified" in call_args


class TestRepurposeContent:
    @pytest.mark.asyncio
    async def test_calls_ask_json(self, mock_ask_json):
        from ai_strategy import repurpose_content
        result = await repurpose_content(
            business_name="Biz", source_content="Some blog content",
            source_type="blog_post", target_platforms=["instagram", "twitter"]
        )
        assert result == {"result": "ok"}
        call_args = mock_ask_json.call_args[0][0]
        assert "Biz" in call_args
        assert "blog_post" in call_args

    @pytest.mark.asyncio
    async def test_default_platforms(self, mock_ask_json):
        from ai_strategy import repurpose_content
        await repurpose_content(business_name="Biz", source_content="content", source_type="video_script")
        call_args = mock_ask_json.call_args[0][0]
        assert "instagram" in call_args
        assert "facebook" in call_args


class TestGenerateImagePrompts:
    @pytest.mark.asyncio
    async def test_calls_ask_json(self, mock_ask_json):
        from ai_strategy import generate_image_prompts
        result = await generate_image_prompts(
            business_name="Biz", content_type="blog_header",
            content_description="SEO guide hero image", brand_colors="green #2D3E32",
            style="professional", platform="blog", count=2
        )
        assert result == {"result": "ok"}
        call_args = mock_ask_json.call_args[0][0]
        assert "Biz" in call_args
        assert "blog_header" in call_args

    @pytest.mark.asyncio
    async def test_default_platform(self, mock_ask_json):
        from ai_strategy import generate_image_prompts
        await generate_image_prompts(business_name="Biz", content_type="social_post", content_description="test")
        call_args = mock_ask_json.call_args[0][0]
        assert "website" in call_args


class TestGetIndustryPack:
    @pytest.mark.asyncio
    async def test_exact_match(self):
        from ai_strategy import get_industry_pack
        result = await get_industry_pack("restaurant")
        assert result["industry"] == "restaurant"
        assert "keywords" in result
        assert "faq_patterns" in result
        assert "content_themes" in result

    @pytest.mark.asyncio
    async def test_partial_match(self):
        from ai_strategy import get_industry_pack
        result = await get_industry_pack("restaurant business")
        assert result["industry"] == "restaurant"

    @pytest.mark.asyncio
    async def test_unknown_industry(self):
        from ai_strategy import get_industry_pack
        result = await get_industry_pack("nonexistent_industry_xyz")
        assert result["industry"] == "nonexistent_industry_xyz"
        assert "keywords" in result
        assert "faq_patterns" in result

    @pytest.mark.asyncio
    async def test_case_insensitive(self):
        from ai_strategy import get_industry_pack
        result = await get_industry_pack("RESTAURANT")
        assert result["industry"] == "restaurant"

    @pytest.mark.asyncio
    async def test_all_known_industries(self):
        from ai_strategy import get_industry_pack, INDUSTRY_TEMPLATES
        for industry in INDUSTRY_TEMPLATES:
            result = await get_industry_pack(industry)
            assert result["industry"] == industry
            assert len(result["keywords"]) > 0
            assert len(result["faq_patterns"]) > 0
            assert len(result["content_themes"]) > 0
