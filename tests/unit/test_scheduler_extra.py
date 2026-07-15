"""Additional tests for scheduler.py — start() tick function, and nurture_service _schedule_async happy path."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime, timezone, timedelta


class TestSchedulerStartTick:
    """Tests for the inner tick() function in scheduler.start()."""

    def test_start_creates_scheduler_and_returns_it(self):
        import scheduler as sched_mod
        sched_mod._scheduler = None
        with patch("os.environ.get", return_value="true"):
            with patch("scheduler.AsyncIOScheduler") as mock_sched_cls:
                mock_sched = MagicMock()
                mock_sched_cls.return_value = mock_sched
                result = sched_mod.start(MagicMock(), lambda: "https://base.com")
                assert result is mock_sched
                mock_sched.add_job.assert_called_once()
                mock_sched.start.assert_called_once()
        sched_mod._scheduler = None

    @pytest.mark.asyncio
    async def test_tick_runs_due_audits(self):
        import scheduler as sched_mod
        sched_mod._scheduler = None
        with patch("os.environ.get", return_value="true"):
            with patch("scheduler.AsyncIOScheduler") as mock_sched_cls:
                mock_sched = MagicMock()
                mock_sched_cls.return_value = mock_sched
                with patch("scheduler.run_due_audits") as mock_run:
                    mock_run.return_value = {"due": 0, "ran": 0, "failures": 0}
                    sched_mod.start(MagicMock(), lambda: "https://base.com")
                    # Extract the tick function that was passed to add_job
                    tick_fn = mock_sched.add_job.call_args[0][0]
                    await tick_fn()
                    mock_run.assert_called_once()
        sched_mod._scheduler = None

    @pytest.mark.asyncio
    async def test_tick_handles_crash(self):
        import scheduler as sched_mod
        sched_mod._scheduler = None
        with patch("os.environ.get", return_value="true"):
            with patch("scheduler.AsyncIOScheduler") as mock_sched_cls:
                mock_sched = MagicMock()
                mock_sched_cls.return_value = mock_sched
                with patch("scheduler.run_due_audits") as mock_run:
                    mock_run.side_effect = Exception("DB down")
                    sched_mod.start(MagicMock(), lambda: "https://base.com")
                    tick_fn = mock_sched.add_job.call_args[0][0]
                    await tick_fn()  # Should not raise
        sched_mod._scheduler = None

    @pytest.mark.asyncio
    async def test_tick_runs_daily_notifications_at_2am(self):
        import scheduler as sched_mod
        sched_mod._scheduler = None
        with patch("os.environ.get", return_value="true"):
            with patch("scheduler.AsyncIOScheduler") as mock_sched_cls:
                mock_sched = MagicMock()
                mock_sched_cls.return_value = mock_sched
                with patch("scheduler.run_due_audits") as mock_run:
                    mock_run.return_value = {"due": 0, "ran": 0, "failures": 0}
                    with patch("scheduler.datetime") as mock_dt:
                        mock_now = MagicMock()
                        mock_now.hour = 2
                        mock_now.day = 1
                        mock_dt.now.return_value = mock_now
                        with patch("notifications.run_daily_notifications") as mock_notif:
                            with patch("scheduler._check_trial_end_notifications") as mock_trial:
                                with patch("scheduler._send_reengagement_emails") as mock_reengage:
                                    with patch("scheduler._send_monthly_roi_reports") as mock_roi:
                                        sched_mod.start(MagicMock(), lambda: "https://base.com")
                                        tick_fn = mock_sched.add_job.call_args[0][0]
                                        await tick_fn()
                                        mock_notif.assert_called_once()
                                        mock_trial.assert_called_once()
                                        mock_reengage.assert_called_once()
                                        mock_roi.assert_called_once()
        sched_mod._scheduler = None

    @pytest.mark.asyncio
    async def test_tick_skips_daily_at_other_hours(self):
        import scheduler as sched_mod
        sched_mod._scheduler = None
        with patch("os.environ.get", return_value="true"):
            with patch("scheduler.AsyncIOScheduler") as mock_sched_cls:
                mock_sched = MagicMock()
                mock_sched_cls.return_value = mock_sched
                with patch("scheduler.run_due_audits") as mock_run:
                    mock_run.return_value = {"due": 0, "ran": 0, "failures": 0}
                    with patch("scheduler.datetime") as mock_dt:
                        mock_now = MagicMock()
                        mock_now.hour = 15  # 3pm
                        mock_dt.now.return_value = mock_now
                        with patch("notifications.run_daily_notifications") as mock_notif:
                            sched_mod.start(MagicMock(), lambda: "https://base.com")
                            tick_fn = mock_sched.add_job.call_args[0][0]
                            await tick_fn()
                            mock_notif.assert_not_called()
        sched_mod._scheduler = None

    @pytest.mark.asyncio
    async def test_tick_handles_daily_notifications_crash(self):
        import scheduler as sched_mod
        sched_mod._scheduler = None
        with patch("os.environ.get", return_value="true"):
            with patch("scheduler.AsyncIOScheduler") as mock_sched_cls:
                mock_sched = MagicMock()
                mock_sched_cls.return_value = mock_sched
                with patch("scheduler.run_due_audits") as mock_run:
                    mock_run.return_value = {"due": 0, "ran": 0, "failures": 0}
                    with patch("scheduler.datetime") as mock_dt:
                        mock_now = MagicMock()
                        mock_now.hour = 2
                        mock_now.day = 15
                        mock_dt.now.return_value = mock_now
                        with patch("notifications.run_daily_notifications") as mock_notif:
                            mock_notif.side_effect = Exception("notif crash")
                            sched_mod.start(MagicMock(), lambda: "https://base.com")
                            tick_fn = mock_sched.add_job.call_args[0][0]
                            await tick_fn()  # Should not raise
        sched_mod._scheduler = None


class TestNurtureScheduleAsyncHappyPath:
    """Tests for _schedule_async() — the APScheduler happy path."""

    def test_schedules_with_date_trigger(self):
        with patch("apscheduler.triggers.date.DateTrigger") as mock_trigger:
            with patch("scheduler.get_scheduler") as mock_get:
                from nurture_service import _schedule_async
                async def dummy_coro():
                    pass
                mock_scheduler = MagicMock()
                mock_scheduler.add_job = MagicMock()
                mock_get.return_value = mock_scheduler
                _schedule_async(dummy_coro, hours=48)
                mock_scheduler.add_job.assert_called_once()
                mock_trigger.assert_called_once()

    def test_fallback_logs_when_no_scheduler(self):
        with patch("scheduler.get_scheduler") as mock_get:
            from nurture_service import _schedule_async
            async def dummy_coro():
                pass
            mock_get.return_value = None
            _schedule_async(dummy_coro, hours=48)
            # Should not raise — falls back to logging

    def test_fallback_when_apscheduler_import_fails(self):
        # Simulate apscheduler not being importable inside _schedule_async
        from nurture_service import _schedule_async
        async def dummy_coro():
            pass
        # Patch the import inside _schedule_async, not the module import
        with patch("apscheduler.triggers.date.DateTrigger", side_effect=ImportError):
            _schedule_async(dummy_coro, hours=48)
            # Should not raise — falls back to logging
