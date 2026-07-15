"""Unit tests for ai_remediation.py — generate_fixes, generate_single_fix, generate_content_grader."""
import pytest
from unittest.mock import AsyncMock, patch


@pytest.fixture(autouse=True)
def mock_ask_json():
    with patch("ai_remediation.ask_json") as mock:
        mock.return_value = {"result": "ok"}
        yield mock


class TestGenerateFixes:
    @pytest.mark.asyncio
    async def test_calls_ask_json(self, mock_ask_json):
        from ai_remediation import generate_fixes
        issues = [{"title": "Missing H1", "severity": "high", "description": "No H1 tag", "category": "headings"}]
        result = await generate_fixes(business_name="Biz", website_url="https://biz.com", audit_issues=issues, industry="retail", location="NYC")
        assert result == {"result": "ok"}
        call_args = mock_ask_json.call_args[0][0]
        assert "Biz" in call_args
        assert "Missing H1" in call_args

    @pytest.mark.asyncio
    async def test_with_current_meta(self, mock_ask_json):
        from ai_remediation import generate_fixes
        issues = [{"title": "Bad title", "severity": "medium", "description": "Title too long", "category": "meta_tags"}]
        meta = {"title": "Old Title", "description": "Old Desc", "h1": "Old H1"}
        await generate_fixes(business_name="Biz", website_url="https://biz.com", audit_issues=issues, current_meta=meta)
        call_args = mock_ask_json.call_args[0][0]
        assert "Old Title" in call_args

    @pytest.mark.asyncio
    async def test_empty_issues(self, mock_ask_json):
        from ai_remediation import generate_fixes
        await generate_fixes(business_name="Biz", website_url="https://biz.com", audit_issues=[])
        mock_ask_json.assert_called_once()


class TestGenerateSingleFix:
    @pytest.mark.asyncio
    async def test_calls_ask_json(self, mock_ask_json):
        from ai_remediation import generate_single_fix
        result = await generate_single_fix(
            business_name="Biz", website_url="https://biz.com",
            issue_title="Missing meta description", issue_description="No meta desc found",
            issue_category="meta_tags", current_value=""
        )
        assert result == {"result": "ok"}
        call_args = mock_ask_json.call_args[0][0]
        assert "Missing meta description" in call_args


class TestGenerateContentGrader:
    @pytest.mark.asyncio
    async def test_calls_ask_json(self, mock_ask_json):
        from ai_remediation import generate_content_grader
        result = await generate_content_grader(
            business_name="Biz", page_url="https://biz.com/page",
            page_content="<p>Hello world</p>", target_keywords="hello"
        )
        assert result == {"result": "ok"}
        call_args = mock_ask_json.call_args[0][0]
        assert "Biz" in call_args
        assert "Hello world" in call_args
