"""Additional tests for nurture_service.py — inner _send() functions in _schedule_email_2 and _schedule_email_3."""
import pytest
import asyncio
from unittest.mock import AsyncMock, patch, MagicMock


class TestScheduleEmail2Send:
    """Tests for the inner _send() function in _schedule_email_2()."""

    def test_send_success(self):
        with patch("email_service.nurture_email_2_html") as mock_html, \
             patch("email_service.send_html_email") as mock_send:
            from nurture_service import _schedule_email_2
            with patch("nurture_service._schedule_async") as mock_sched:
                mock_html.return_value = "<html>email2</html>"
                mock_send.return_value = {"id": "msg2"}
                issues = [{"message": "Missing H1", "fix": "Add H1 tag"}]
                _schedule_email_2(email="test@test.com", name="Test", score=65, issues=issues, signup_url="https://x.com/register")
                coro_fn = mock_sched.call_args[0][0]
                asyncio.run(coro_fn())
                mock_send.assert_called_once()

    def test_send_failure_handled(self):
        with patch("email_service.nurture_email_2_html") as mock_html, \
             patch("email_service.send_html_email") as mock_send:
            from nurture_service import _schedule_email_2
            with patch("nurture_service._schedule_async") as mock_sched:
                mock_html.return_value = "<html>email2</html>"
                mock_send.side_effect = Exception("SMTP down")
                issues = [{"message": "Missing H1", "fix": "Add H1 tag"}]
                _schedule_email_2(email="test@test.com", name="Test", score=65, issues=issues, signup_url="https://x.com/register")
                coro_fn = mock_sched.call_args[0][0]
                asyncio.run(coro_fn())
                # Should not raise


class TestScheduleEmail3Send:
    """Tests for the inner _send() function in _schedule_email_3()."""

    def test_send_success(self):
        with patch("email_service.nurture_email_3_html") as mock_html, \
             patch("email_service.send_html_email") as mock_send:
            from nurture_service import _schedule_email_3
            with patch("nurture_service._schedule_async") as mock_sched:
                mock_html.return_value = "<html>email3</html>"
                mock_send.return_value = {"id": "msg3"}
                _schedule_email_3(email="test@test.com", name="Test", signup_url="https://x.com/register")
                coro_fn = mock_sched.call_args[0][0]
                asyncio.run(coro_fn())
                mock_send.assert_called_once()

    def test_send_failure_handled(self):
        with patch("email_service.nurture_email_3_html") as mock_html, \
             patch("email_service.send_html_email") as mock_send:
            from nurture_service import _schedule_email_3
            with patch("nurture_service._schedule_async") as mock_sched:
                mock_html.return_value = "<html>email3</html>"
                mock_send.side_effect = Exception("SMTP down")
                _schedule_email_3(email="test@test.com", name="Test", signup_url="https://x.com/register")
                coro_fn = mock_sched.call_args[0][0]
                asyncio.run(coro_fn())
                # Should not raise
