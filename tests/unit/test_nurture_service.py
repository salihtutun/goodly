"""Unit tests for nurture_service.py — nurture email sequence scheduling."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class TestScheduleNurtureSequence:
    """Tests for schedule_nurture_sequence()."""

    @pytest.mark.asyncio
    async def test_sends_email_1_immediately(self):
        # send_html_email and nurture_email_*_html are imported inside the function from email_service
        with patch("email_service.send_html_email") as mock_send, \
             patch("email_service.nurture_email_1_html") as mock_html1, \
             patch("nurture_service._schedule_email_2") as mock_sched2, \
             patch("nurture_service._schedule_email_3") as mock_sched3:
            from nurture_service import schedule_nurture_sequence
            mock_html1.return_value = "<html>email1</html>"
            mock_send.return_value = {"id": "msg1"}
            result = await schedule_nurture_sequence(
                email="test@example.com", score=65, issues_count=5,
                top_issue="Missing meta description", issues=[],
                frontend_url="https://example.com"
            )
            assert result == {"ok": True, "email": "test@example.com", "sequence": "started"}
            mock_send.assert_called_once()
            mock_sched2.assert_called_once()
            mock_sched3.assert_called_once()

    @pytest.mark.asyncio
    async def test_email_1_failure_continues(self):
        with patch("email_service.send_html_email") as mock_send, \
             patch("email_service.nurture_email_1_html") as mock_html1, \
             patch("nurture_service._schedule_email_2") as mock_sched2, \
             patch("nurture_service._schedule_email_3") as mock_sched3:
            from nurture_service import schedule_nurture_sequence
            mock_html1.return_value = "<html>email1</html>"
            mock_send.side_effect = Exception("SMTP down")
            result = await schedule_nurture_sequence(
                email="test@example.com", score=65, issues_count=5,
                top_issue="Missing meta description", issues=[],
            )
            assert result == {"ok": True, "email": "test@example.com", "sequence": "started"}
            mock_sched2.assert_called_once()
            mock_sched3.assert_called_once()

    @pytest.mark.asyncio
    async def test_schedule_2_failure_continues(self):
        with patch("email_service.send_html_email") as mock_send, \
             patch("email_service.nurture_email_1_html") as mock_html1, \
             patch("nurture_service._schedule_email_2") as mock_sched2, \
             patch("nurture_service._schedule_email_3") as mock_sched3:
            from nurture_service import schedule_nurture_sequence
            mock_html1.return_value = "<html>email1</html>"
            mock_send.return_value = {"id": "msg1"}
            mock_sched2.side_effect = Exception("Scheduler down")
            result = await schedule_nurture_sequence(
                email="test@example.com", score=65, issues_count=5,
                top_issue="Missing meta description", issues=[],
            )
            assert result == {"ok": True, "email": "test@example.com", "sequence": "started"}
            mock_sched3.assert_called_once()

    @pytest.mark.asyncio
    async def test_uses_env_fallback_for_frontend_url(self):
        with patch("email_service.send_html_email") as mock_send, \
             patch("email_service.nurture_email_1_html") as mock_html1, \
             patch("nurture_service._schedule_email_2") as mock_sched2, \
             patch("nurture_service._schedule_email_3") as mock_sched3, \
             patch("os.environ.get") as mock_env:
            from nurture_service import schedule_nurture_sequence
            mock_html1.return_value = "<html>email1</html>"
            mock_send.return_value = {"id": "msg1"}
            mock_env.return_value = "https://env.example.com"
            result = await schedule_nurture_sequence(
                email="test@example.com", score=65, issues_count=5,
                top_issue="Missing meta description", issues=[],
            )
            assert result["ok"] is True

    @pytest.mark.asyncio
    async def test_name_extracted_from_email(self):
        with patch("email_service.send_html_email") as mock_send, \
             patch("email_service.nurture_email_1_html") as mock_html1, \
             patch("nurture_service._schedule_email_2") as mock_sched2, \
             patch("nurture_service._schedule_email_3") as mock_sched3:
            from nurture_service import schedule_nurture_sequence
            mock_html1.return_value = "<html>email1</html>"
            mock_send.return_value = {"id": "msg1"}
            await schedule_nurture_sequence(
                email="john.doe@example.com", score=65, issues_count=5,
                top_issue="Missing meta description", issues=[],
            )
            call_kwargs = mock_html1.call_args[1]
            assert call_kwargs["name"] == "john.doe"


class TestScheduleEmail2:
    """Tests for _schedule_email_2()."""

    def test_schedules_with_issues(self):
        with patch("nurture_service._schedule_async") as mock_sched:
            from nurture_service import _schedule_email_2
            issues = [
                {"message": "Missing H1", "fix": "Add an H1 tag"},
                {"message": "Slow load", "fix": "Compress images"},
                {"message": "No meta desc", "fix": "Add meta description"},
            ]
            _schedule_email_2(
                email="test@example.com", name="Test", score=65,
                issues=issues, signup_url="https://example.com/register"
            )
            mock_sched.assert_called_once()
            assert mock_sched.call_args[1]["hours"] == 48

    def test_handles_issues_without_message(self):
        with patch("nurture_service._schedule_async") as mock_sched:
            from nurture_service import _schedule_email_2
            issues = [{"fix": "Add an H1 tag"}]
            _schedule_email_2(
                email="test@example.com", name="Test", score=65,
                issues=issues, signup_url="https://example.com/register"
            )
            mock_sched.assert_called_once()

    def test_handles_empty_issues(self):
        with patch("nurture_service._schedule_async") as mock_sched:
            from nurture_service import _schedule_email_2
            _schedule_email_2(
                email="test@example.com", name="Test", score=65,
                issues=[], signup_url="https://example.com/register"
            )
            mock_sched.assert_called_once()


class TestScheduleEmail3:
    """Tests for _schedule_email_3()."""

    def test_schedules_with_120_hours(self):
        with patch("nurture_service._schedule_async") as mock_sched:
            from nurture_service import _schedule_email_3
            _schedule_email_3(
                email="test@example.com", name="Test",
                signup_url="https://example.com/register"
            )
            mock_sched.assert_called_once()
            assert mock_sched.call_args[1]["hours"] == 120


class TestScheduleAsync:
    """Tests for _schedule_async()."""

    def test_schedules_with_apscheduler(self):
        # scheduler is imported inside _schedule_async via `import scheduler as scheduler_mod`
        with patch("scheduler.get_scheduler") as mock_get:
            from nurture_service import _schedule_async
            async def dummy_coro():
                pass
            mock_scheduler = MagicMock()
            mock_scheduler.add_job = MagicMock()
            mock_get.return_value = mock_scheduler
            _schedule_async(dummy_coro, hours=48)
            mock_scheduler.add_job.assert_called_once()

    def test_falls_back_when_no_scheduler(self):
        with patch("scheduler.get_scheduler") as mock_get:
            from nurture_service import _schedule_async
            async def dummy_coro():
                pass
            mock_get.side_effect = Exception("No scheduler")
            _schedule_async(dummy_coro, hours=48)
            # Should not raise

    def test_falls_back_when_scheduler_is_none(self):
        with patch("scheduler.get_scheduler") as mock_get:
            from nurture_service import _schedule_async
            async def dummy_coro():
                pass
            mock_get.return_value = None
            _schedule_async(dummy_coro, hours=48)
            # Should not raise

    def test_falls_back_when_scheduler_no_add_job(self):
        with patch("scheduler.get_scheduler") as mock_get:
            from nurture_service import _schedule_async
            async def dummy_coro():
                pass
            mock_scheduler = MagicMock(spec=[])  # No add_job
            mock_get.return_value = mock_scheduler
            _schedule_async(dummy_coro, hours=48)
            # Should not raise
