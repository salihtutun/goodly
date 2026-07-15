"""Unit tests for scheduler.py — scheduled audits, trial notifications, ROI reports, re-engagement."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone, timedelta


class TestPreviousScore:
    """Tests for _previous_score()."""

    @pytest.mark.asyncio
    async def test_returns_score(self):
        from scheduler import _previous_score
        mock_db = MagicMock()
        mock_db.audits.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[
            {"result": {"overall_score": 85}}
        ])
        result = await _previous_score(mock_db, "proj1")
        assert result == 85

    @pytest.mark.asyncio
    async def test_no_audits_returns_none(self):
        from scheduler import _previous_score
        mock_db = MagicMock()
        mock_db.audits.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
        result = await _previous_score(mock_db, "proj1")
        assert result is None

    @pytest.mark.asyncio
    async def test_no_result_returns_none(self):
        from scheduler import _previous_score
        mock_db = MagicMock()
        mock_db.audits.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[{}])
        result = await _previous_score(mock_db, "proj1")
        assert result is None


class TestRunOneScheduledAudit:
    """Tests for _run_one_scheduled_audit()."""

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        from scheduler import _run_one_scheduled_audit
        mock_db = MagicMock()
        mock_db.users.find_one = AsyncMock(return_value=None)
        result = await _run_one_scheduled_audit(mock_db, {"id": "p1", "user_id": "u1", "url": "https://x.com", "name": "Test"}, "https://base.com")
        assert result == {"skipped": "user_not_found"}

    @pytest.mark.asyncio
    async def test_runs_audit_successfully(self):
        from scheduler import _run_one_scheduled_audit
        with patch("scheduler.analyze_url") as mock_analyze, \
             patch("scheduler.ai_service.audit_recommendations") as mock_ai, \
             patch("scheduler.email_service") as mock_email:
            mock_db = MagicMock()
            mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
            mock_db.audits.insert_one = AsyncMock()
            mock_db.projects.update_one = AsyncMock()
            mock_db.scheduled_runs.insert_one = AsyncMock()
            mock_db.notifications = MagicMock()
            mock_db.notifications.insert_one = AsyncMock()
            mock_analyze.return_value = {"url": "https://x.com", "overall_score": 80, "fetch_failed": False, "issues": []}
            mock_ai.return_value = {"priority_actions": ["fix1"]}
            mock_email.audit_digest_html.return_value = "<html>digest</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1", "mocked": False})
            mock_email.rank_change_html.return_value = "<html>rank</html>"
            result = await _run_one_scheduled_audit(mock_db, {"id": "p1", "user_id": "u1", "url": "https://x.com", "name": "Test"}, "https://base.com")
            assert result["audit_id"] is not None
            assert result["score"] == 80
            mock_db.audits.insert_one.assert_called_once()
            mock_db.projects.update_one.assert_called_once()
            mock_db.scheduled_runs.insert_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_handles_fetch_failed(self):
        from scheduler import _run_one_scheduled_audit
        with patch("scheduler.analyze_url") as mock_analyze, \
             patch("scheduler.email_service") as mock_email:
            mock_db = MagicMock()
            mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
            mock_db.audits.insert_one = AsyncMock()
            mock_db.projects.update_one = AsyncMock()
            mock_db.scheduled_runs.insert_one = AsyncMock()
            mock_db.notifications = MagicMock()
            mock_db.notifications.insert_one = AsyncMock()
            mock_analyze.return_value = {"url": "https://x.com", "overall_score": 0, "fetch_failed": True, "issues": []}
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1", "mocked": False})
            result = await _run_one_scheduled_audit(mock_db, {"id": "p1", "user_id": "u1", "url": "https://x.com", "name": "Test"}, "https://base.com")
            assert result["audit_id"] is not None

    @pytest.mark.asyncio
    async def test_ai_recs_failure_handled(self):
        from scheduler import _run_one_scheduled_audit
        with patch("scheduler.analyze_url") as mock_analyze, \
             patch("scheduler.ai_service.audit_recommendations") as mock_ai, \
             patch("scheduler.email_service") as mock_email:
            mock_db = MagicMock()
            mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
            mock_db.audits.insert_one = AsyncMock()
            mock_db.projects.update_one = AsyncMock()
            mock_db.scheduled_runs.insert_one = AsyncMock()
            mock_db.notifications = MagicMock()
            mock_db.notifications.insert_one = AsyncMock()
            mock_analyze.return_value = {"url": "https://x.com", "overall_score": 70, "fetch_failed": False, "issues": []}
            mock_ai.side_effect = Exception("AI down")
            mock_email.audit_digest_html.return_value = "<html>digest</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1", "mocked": False})
            result = await _run_one_scheduled_audit(mock_db, {"id": "p1", "user_id": "u1", "url": "https://x.com", "name": "Test"}, "https://base.com")
            assert result["audit_id"] is not None

    @pytest.mark.asyncio
    async def test_score_delta_triggers_rank_alert(self):
        from scheduler import _run_one_scheduled_audit
        with patch("scheduler.analyze_url") as mock_analyze, \
             patch("scheduler.ai_service.audit_recommendations") as mock_ai, \
             patch("scheduler.email_service") as mock_email:
            mock_db = MagicMock()
            mock_db.users.find_one = AsyncMock(return_value={"id": "u1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[
                {"result": {"overall_score": 60}}
            ])
            mock_db.audits.insert_one = AsyncMock()
            mock_db.projects.update_one = AsyncMock()
            mock_db.scheduled_runs.insert_one = AsyncMock()
            mock_db.notifications = MagicMock()
            mock_db.notifications.insert_one = AsyncMock()
            mock_analyze.return_value = {"url": "https://x.com", "overall_score": 75, "fetch_failed": False, "issues": []}
            mock_ai.return_value = {"priority_actions": ["fix1"]}
            mock_email.audit_digest_html.return_value = "<html>digest</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1", "mocked": False})
            mock_email.rank_change_html.return_value = "<html>rank</html>"
            result = await _run_one_scheduled_audit(mock_db, {"id": "p1", "user_id": "u1", "url": "https://x.com", "name": "Test"}, "https://base.com")
            assert result["audit_id"] is not None
            # Should have sent rank change email + notification
            assert mock_email.send_html_email.call_count >= 2
            mock_db.notifications.insert_one.assert_called_once()


class TestRunDueAudits:
    """Tests for run_due_audits()."""

    @pytest.mark.asyncio
    async def test_no_due_projects(self):
        from scheduler import run_due_audits
        mock_db = MagicMock()
        mock_db.projects.find.return_value.to_list = AsyncMock(return_value=[])
        result = await run_due_audits(mock_db, "https://base.com")
        assert result == {"due": 0, "ran": 0, "failures": 0}

    @pytest.mark.asyncio
    async def test_runs_due_projects(self):
        from scheduler import run_due_audits
        with patch("scheduler._run_one_scheduled_audit") as mock_run:
            mock_db = MagicMock()
            mock_db.projects.find.return_value.to_list = AsyncMock(return_value=[
                {"id": "p1", "user_id": "u1", "url": "https://x.com", "name": "Test"},
                {"id": "p2", "user_id": "u2", "url": "https://y.com", "name": "Test2"},
            ])
            mock_run.return_value = {"audit_id": "a1", "score": 80}
            result = await run_due_audits(mock_db, "https://base.com")
            assert result["due"] == 2
            assert result["ran"] == 2
            assert result["failures"] == 0

    @pytest.mark.asyncio
    async def test_handles_failures(self):
        from scheduler import run_due_audits
        with patch("scheduler._run_one_scheduled_audit") as mock_run:
            mock_db = MagicMock()
            mock_db.projects.find.return_value.to_list = AsyncMock(return_value=[
                {"id": "p1", "user_id": "u1", "url": "https://x.com", "name": "Test"},
            ])
            mock_db.projects.update_one = AsyncMock()
            mock_run.side_effect = Exception("DB error")
            result = await run_due_audits(mock_db, "https://base.com")
            assert result["failures"] == 1
            # Should advance next_audit_at even on failure
            mock_db.projects.update_one.assert_called_once()


class TestSchedulerLifecycle:
    """Tests for start(), get_scheduler(), shutdown()."""

    def test_get_scheduler_returns_none_initially(self):
        from scheduler import get_scheduler
        import scheduler as sched_mod
        sched_mod._scheduler = None
        assert get_scheduler() is None

    def test_shutdown_handles_none(self):
        from scheduler import shutdown
        import scheduler as sched_mod
        sched_mod._scheduler = None
        shutdown()  # Should not raise

    def test_start_disabled_by_env(self):
        import scheduler as sched_mod
        sched_mod._scheduler = None
        with patch("os.environ.get", return_value="false"):
            result = sched_mod.start(MagicMock(), lambda: "https://base.com")
            assert result is None

    def test_start_already_running(self):
        import scheduler as sched_mod
        mock_sched = MagicMock()
        sched_mod._scheduler = mock_sched
        result = sched_mod.start(MagicMock(), lambda: "https://base.com")
        assert result is mock_sched
        sched_mod._scheduler = None


class TestTrialEndNotifications:
    """Tests for _check_trial_end_notifications()."""

    @pytest.mark.asyncio
    async def test_no_trial_users(self):
        from scheduler import _check_trial_end_notifications
        mock_db = MagicMock()
        mock_db.users.find.return_value.to_list = AsyncMock(return_value=[])
        await _check_trial_end_notifications(mock_db, "https://base.com")
        # Should not raise

    @pytest.mark.asyncio
    async def test_trial_ending_notification(self):
        from scheduler import _check_trial_end_notifications
        with patch("scheduler.email_service") as mock_email:
            mock_db = MagicMock()
            five_days_ago = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
            mock_db.users.find.return_value.to_list = AsyncMock(return_value=[{
                "id": "u1", "email": "a@b.com", "name": "Test",
                "plan": "starter", "plan_started_at": five_days_ago,
                "on_trial": True,
            }])
            mock_db.users.update_one = AsyncMock()
            mock_email.trial_ending_html.return_value = "<html>trial</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1"})
            await _check_trial_end_notifications(mock_db, "https://base.com")
            mock_email.send_html_email.assert_called_once()
            mock_db.users.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_trial_expired_notification(self):
        from scheduler import _check_trial_end_notifications
        with patch("scheduler.email_service") as mock_email:
            mock_db = MagicMock()
            eight_days_ago = (datetime.now(timezone.utc) - timedelta(days=8)).isoformat()
            mock_db.users.find.return_value.to_list = AsyncMock(return_value=[{
                "id": "u1", "email": "a@b.com", "name": "Test",
                "plan": "pro", "plan_started_at": eight_days_ago,
                "on_trial": True,
            }])
            mock_db.users.update_one = AsyncMock()
            mock_email.trial_expired_html.return_value = "<html>expired</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1"})
            await _check_trial_end_notifications(mock_db, "https://base.com")
            mock_email.send_html_email.assert_called_once()

    @pytest.mark.asyncio
    async def test_already_notified_skipped(self):
        from scheduler import _check_trial_end_notifications
        with patch("scheduler.email_service") as mock_email:
            mock_db = MagicMock()
            five_days_ago = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
            mock_db.users.find.return_value.to_list = AsyncMock(return_value=[{
                "id": "u1", "email": "a@b.com", "name": "Test",
                "plan": "starter", "plan_started_at": five_days_ago,
                "on_trial": True, "trial_end_notified": "2024-01-01T00:00:00",
            }])
            await _check_trial_end_notifications(mock_db, "https://base.com")
            mock_email.send_html_email.assert_not_called()


class TestMonthlyROIReports:
    """Tests for _send_monthly_roi_reports()."""

    @pytest.mark.asyncio
    async def test_no_paying_users(self):
        from scheduler import _send_monthly_roi_reports
        mock_db = MagicMock()
        mock_db.users.find.return_value.to_list = AsyncMock(return_value=[])
        await _send_monthly_roi_reports(mock_db, "https://base.com")

    @pytest.mark.asyncio
    async def test_sends_roi_report(self):
        from scheduler import _send_monthly_roi_reports
        with patch("scheduler.email_service") as mock_email:
            mock_db = MagicMock()
            mock_db.users.find.return_value.to_list = AsyncMock(return_value=[{
                "id": "u1", "email": "a@b.com", "name": "Test", "plan": "pro",
            }])
            mock_db.audits.count_documents = AsyncMock(return_value=5)
            mock_db.audits.find_one = AsyncMock(return_value={"result": {"overall_score": 80}})
            mock_email.monthly_roi_html.return_value = "<html>roi</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1"})
            await _send_monthly_roi_reports(mock_db, "https://base.com")
            mock_email.send_html_email.assert_called_once()

    @pytest.mark.asyncio
    async def test_handles_email_failure(self):
        from scheduler import _send_monthly_roi_reports
        with patch("scheduler.email_service") as mock_email:
            mock_db = MagicMock()
            mock_db.users.find.return_value.to_list = AsyncMock(return_value=[{
                "id": "u1", "email": "a@b.com", "name": "Test", "plan": "pro",
            }])
            mock_db.audits.count_documents = AsyncMock(return_value=3)
            mock_db.audits.find_one = AsyncMock(return_value={"result": {"overall_score": 70}})
            mock_email.monthly_roi_html.return_value = "<html>roi</html>"
            mock_email.send_html_email = AsyncMock(side_effect=Exception("fail"))
            await _send_monthly_roi_reports(mock_db, "https://base.com")
            # Should not raise


class TestReengagementEmails:
    """Tests for _send_reengagement_emails()."""

    @pytest.mark.asyncio
    async def test_no_inactive_users(self):
        from scheduler import _send_reengagement_emails
        mock_db = MagicMock()
        mock_db.audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
        mock_db.users.find.return_value.to_list = AsyncMock(return_value=[])
        await _send_reengagement_emails(mock_db, "https://base.com")

    @pytest.mark.asyncio
    async def test_sends_reengagement(self):
        from scheduler import _send_reengagement_emails
        with patch("scheduler.email_service") as mock_email:
            mock_db = MagicMock()
            mock_db.audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            old_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            mock_db.users.find.return_value.to_list = AsyncMock(return_value=[{
                "id": "u1", "email": "a@b.com", "name": "Test", "created_at": old_date,
            }])
            mock_db.audits.find_one = AsyncMock(return_value=None)
            mock_db.users.update_one = AsyncMock()
            mock_email.reengagement_html.return_value = "<html>reengage</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1"})
            await _send_reengagement_emails(mock_db, "https://base.com")
            mock_email.send_html_email.assert_called_once()

    @pytest.mark.asyncio
    async def test_skips_recently_notified(self):
        from scheduler import _send_reengagement_emails
        with patch("scheduler.email_service") as mock_email:
            mock_db = MagicMock()
            mock_db.audits.aggregate.return_value.to_list = AsyncMock(return_value=[])
            old_date = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
            recent_reengagement = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
            mock_db.users.find.return_value.to_list = AsyncMock(return_value=[{
                "id": "u1", "email": "a@b.com", "name": "Test", "created_at": old_date,
                "reengagement_sent_at": recent_reengagement,
            }])
            await _send_reengagement_emails(mock_db, "https://base.com")
            mock_email.send_html_email.assert_not_called()
