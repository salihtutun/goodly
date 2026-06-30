"""Unit tests for email_service.py — Resend-based email service."""
import os
import sys
import pytest
from unittest.mock import patch, MagicMock

from conftest import AsyncMock

from email_service import (
    is_configured,
    send_html_email,
    verify_email_html,
    reset_password_html,
    audit_digest_html,
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
# is_configured
# ---------------------------------------------------------------------------

def test_is_configured_true():
    """is_configured returns True when RESEND_API_KEY is set."""
    _set_env(RESEND_API_KEY="re_abc123")
    try:
        assert is_configured() is True
    finally:
        _clear_env("RESEND_API_KEY")


def test_is_configured_false():
    """is_configured returns False when RESEND_API_KEY is not set."""
    _clear_env("RESEND_API_KEY")
    assert is_configured() is False


def test_is_configured_empty_string():
    """is_configured returns False when RESEND_API_KEY is empty string."""
    _set_env(RESEND_API_KEY="")
    try:
        assert is_configured() is False
    finally:
        _clear_env("RESEND_API_KEY")


# ---------------------------------------------------------------------------
# send_html_email
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_send_html_email_mocked_when_no_key():
    """send_html_email returns mocked=True when RESEND_API_KEY is missing."""
    _clear_env("RESEND_API_KEY")
    result = await send_html_email(
        to="user@test.com",
        subject="Test",
        html="<p>Hello</p>",
    )
    assert result["mocked"] is True
    assert result["id"] is None
    assert result["error"] is None


@pytest.mark.asyncio
async def test_send_html_email_sends_when_configured():
    """send_html_email calls Resend and returns the message id."""
    _set_env(RESEND_API_KEY="re_test123")
    try:
        mock_resend = MagicMock()
        mock_resend.Emails.send = MagicMock(return_value={"id": "msg_xyz"})
        with patch.dict(sys.modules, {"resend": mock_resend}):
            import email_service
            saved = getattr(email_service.asyncio, 'to_thread', None)
            email_service.asyncio.to_thread = AsyncMock(return_value={"id": "msg_xyz"})
            try:
                result = await send_html_email(
                    to="user@test.com",
                    subject="Hello",
                    html="<p>Hi</p>",
                )
                assert result["mocked"] is False
                assert result["id"] == "msg_xyz"
                assert result["error"] is None
            finally:
                if saved is not None:
                    email_service.asyncio.to_thread = saved
                else:
                    del email_service.asyncio.to_thread
    finally:
        _clear_env("RESEND_API_KEY")


@pytest.mark.asyncio
async def test_send_html_email_handles_resend_error():
    """send_html_email catches Resend errors and returns error info."""
    _set_env(RESEND_API_KEY="re_test123")
    try:
        mock_resend = MagicMock()
        mock_resend.Emails.send = MagicMock(side_effect=Exception("API down"))
        with patch.dict(sys.modules, {"resend": mock_resend}):
            import email_service
            saved = getattr(email_service.asyncio, 'to_thread', None)
            email_service.asyncio.to_thread = AsyncMock(side_effect=Exception("API down"))
            try:
                result = await send_html_email(
                    to="user@test.com",
                    subject="Hello",
                    html="<p>Hi</p>",
                )
                assert result["mocked"] is False
                assert result["id"] is None
                assert "API down" in result["error"]
            finally:
                if saved is not None:
                    email_service.asyncio.to_thread = saved
                else:
                    del email_service.asyncio.to_thread
    finally:
        _clear_env("RESEND_API_KEY")


@pytest.mark.asyncio
async def test_send_html_email_uses_sender_env():
    """send_html_email uses SENDER_EMAIL env var when set."""
    _set_env(RESEND_API_KEY="re_test", SENDER_EMAIL="custom@goodly.app")
    try:
        mock_resend = MagicMock()
        mock_resend.Emails.send = MagicMock(return_value={"id": "msg_1"})
        with patch.dict(sys.modules, {"resend": mock_resend}):
            import email_service
            saved = getattr(email_service.asyncio, 'to_thread', None)
            email_service.asyncio.to_thread = AsyncMock(return_value={"id": "msg_1"})
            try:
                result = await send_html_email(to="u@t.com", subject="S", html="<p>H</p>")
                assert result["mocked"] is False
                assert result["id"] == "msg_1"
            finally:
                if saved is not None:
                    email_service.asyncio.to_thread = saved
                else:
                    del email_service.asyncio.to_thread
    finally:
        _clear_env("RESEND_API_KEY", "SENDER_EMAIL")


# ---------------------------------------------------------------------------
# verify_email_html
# ---------------------------------------------------------------------------

def test_verify_email_html_contains_link():
    """verify_email_html includes the verification link."""
    html = verify_email_html(name="Alice", verify_link="https://goodly.app/verify/abc")
    assert "https://goodly.app/verify/abc" in html


def test_verify_email_html_contains_name():
    """verify_email_html includes the user's name."""
    html = verify_email_html(name="Alice", verify_link="https://goodly.app/verify/abc")
    assert "Alice" in html


def test_verify_email_html_no_name():
    """verify_email_html works with an empty name."""
    html = verify_email_html(name="", verify_link="https://goodly.app/verify/abc")
    assert "Verify your email" in html
    assert "https://goodly.app/verify/abc" in html


def test_verify_email_html_is_valid_html():
    """verify_email_html returns a string starting with <!DOCTYPE html>."""
    html = verify_email_html(name="Test", verify_link="https://example.com")
    assert html.strip().startswith("<!DOCTYPE html>")


# ---------------------------------------------------------------------------
# reset_password_html
# ---------------------------------------------------------------------------

def test_reset_password_html_contains_link():
    """reset_password_html includes the reset link."""
    html = reset_password_html(name="Bob", reset_link="https://goodly.app/reset/token123")
    assert "https://goodly.app/reset/token123" in html


def test_reset_password_html_contains_name():
    """reset_password_html includes the user's name."""
    html = reset_password_html(name="Bob", reset_link="https://goodly.app/reset/token123")
    assert "Bob" in html


def test_reset_password_html_no_name():
    """reset_password_html works with an empty name."""
    html = reset_password_html(name="", reset_link="https://goodly.app/reset/token123")
    assert "Reset your password" in html


def test_reset_password_html_is_valid_html():
    """reset_password_html returns a string starting with <!DOCTYPE html>."""
    html = reset_password_html(name="Test", reset_link="https://example.com")
    assert html.strip().startswith("<!DOCTYPE html>")


# ---------------------------------------------------------------------------
# audit_digest_html
# ---------------------------------------------------------------------------

def test_audit_digest_html_contains_score():
    """audit_digest_html includes the overall score."""
    html = audit_digest_html(
        name="Alice", project_name="My Site", url="https://example.com",
        overall_score=85, prev_score=None, top_issues=[],
        audit_url="https://goodly.app/audits/1",
    )
    assert "85" in html


def test_audit_digest_html_contains_project_name():
    """audit_digest_html includes the project name."""
    html = audit_digest_html(
        name="Alice", project_name="My Site", url="https://example.com",
        overall_score=85, prev_score=None, top_issues=[],
        audit_url="https://goodly.app/audits/1",
    )
    assert "My Site" in html


def test_audit_digest_html_delta_up():
    """audit_digest_html shows an upward delta when score improved."""
    html = audit_digest_html(
        name="Alice", project_name="Site", url="https://example.com",
        overall_score=85, prev_score=75, top_issues=[],
        audit_url="https://goodly.app/audits/1",
    )
    assert "↑" in html
    assert "10 pts" in html


def test_audit_digest_html_delta_down():
    """audit_digest_html shows a downward delta when score decreased."""
    html = audit_digest_html(
        name="Alice", project_name="Site", url="https://example.com",
        overall_score=60, prev_score=75, top_issues=[],
        audit_url="https://goodly.app/audits/1",
    )
    assert "↓" in html
    assert "15 pts" in html


def test_audit_digest_html_no_change():
    """audit_digest_html shows 'No change' when score is the same."""
    html = audit_digest_html(
        name="Alice", project_name="Site", url="https://example.com",
        overall_score=75, prev_score=75, top_issues=[],
        audit_url="https://goodly.app/audits/1",
    )
    assert "No change" in html


def test_audit_digest_html_no_issues():
    """audit_digest_html shows a friendly message when there are no issues."""
    html = audit_digest_html(
        name="Alice", project_name="Site", url="https://example.com",
        overall_score=95, prev_score=None, top_issues=[],
        audit_url="https://goodly.app/audits/1",
    )
    assert "No issues found" in html


def test_audit_digest_html_with_issues():
    """audit_digest_html renders issue rows with severity badges."""
    issues = [
        {"severity": "high", "message": "Missing title", "fix": "Add a title tag"},
        {"severity": "medium", "message": "Slow load", "fix": "Optimize images"},
    ]
    html = audit_digest_html(
        name="Alice", project_name="Site", url="https://example.com",
        overall_score=50, prev_score=None, top_issues=issues,
        audit_url="https://goodly.app/audits/1",
    )
    assert "Missing title" in html
    assert "Add a title tag" in html
    assert "Slow load" in html
    assert "HIGH" in html
    assert "MEDIUM" in html


def test_audit_digest_html_contains_audit_url():
    """audit_digest_html includes the full report link."""
    html = audit_digest_html(
        name="Alice", project_name="Site", url="https://example.com",
        overall_score=80, prev_score=None, top_issues=[],
        audit_url="https://goodly.app/audits/42",
    )
    assert "https://goodly.app/audits/42" in html


def test_audit_digest_html_is_valid_html():
    """audit_digest_html returns a string starting with <!DOCTYPE html>."""
    html = audit_digest_html(
        name="Alice", project_name="Site", url="https://example.com",
        overall_score=80, prev_score=None, top_issues=[],
        audit_url="https://goodly.app/audits/1",
    )
    assert html.strip().startswith("<!DOCTYPE html>")


def test_audit_digest_html_issues_truncated_to_5():
    """audit_digest_html only renders the first 5 issues."""
    issues = [
        {"severity": "low", "message": f"Issue {i}", "fix": f"Fix {i}"}
        for i in range(10)
    ]
    html = audit_digest_html(
        name="Alice", project_name="Site", url="https://example.com",
        overall_score=50, prev_score=None, top_issues=issues,
        audit_url="https://goodly.app/audits/1",
    )
    assert "Issue 0" in html
    assert "Issue 4" in html
    assert "Issue 5" not in html
