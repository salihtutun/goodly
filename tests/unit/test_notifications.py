"""Unit tests for notifications.py — weekly digest, rank alerts, competitor alerts, audit reminders."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


# Must mock database.db BEFORE importing notifications
@pytest.fixture(autouse=True)
def mock_database_db():
    with patch("database.db", MagicMock()) as mock_db:
        yield mock_db


class TestSendWeeklyDigest:
    """Tests for send_weekly_digest()."""

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        from notifications import send_weekly_digest
        with patch("notifications.db") as mock_db:
            mock_db.users.find_one = AsyncMock(return_value=None)
            result = await send_weekly_digest("user1", "https://example.com")
            assert result == {"skipped": "user_not_found"}

    @pytest.mark.asyncio
    async def test_no_audits(self):
        from notifications import send_weekly_digest
        with patch("notifications.db") as mock_db:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find_one = AsyncMock(return_value=None)
            result = await send_weekly_digest("user1", "https://example.com")
            assert result == {"skipped": "no_audits"}

    @pytest.mark.asyncio
    async def test_sends_digest_successfully(self):
        from notifications import send_weekly_digest
        with patch("notifications.db") as mock_db, patch("notifications.email_service") as mock_email:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find_one = AsyncMock(side_effect=[
                {"id": "audit1", "user_id": "user1", "result": {"overall_score": 85, "issues": [{"severity": "high", "message": "bad"}]}, "ai_recommendations": {"priority_actions": ["fix1"]}},
                None,
            ])
            mock_email.weekly_digest_html.return_value = "<html>digest</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1"})
            result = await send_weekly_digest("user1", "https://example.com")
            assert result == {"sent": True, "score": 85}
            mock_email.send_html_email.assert_called_once()

    @pytest.mark.asyncio
    async def test_email_failure_returns_error(self):
        from notifications import send_weekly_digest
        with patch("notifications.db") as mock_db, patch("notifications.email_service") as mock_email:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find_one = AsyncMock(side_effect=[
                {"id": "audit1", "user_id": "user1", "result": {"overall_score": 70, "issues": []}, "ai_recommendations": {}},
                None,
            ])
            mock_email.weekly_digest_html.return_value = "<html>digest</html>"
            mock_email.send_html_email = AsyncMock(side_effect=Exception("SMTP error"))
            result = await send_weekly_digest("user1", "https://example.com")
            assert result["sent"] is False
            assert "SMTP error" in result["error"]

    @pytest.mark.asyncio
    async def test_with_previous_audit_score_delta(self):
        from notifications import send_weekly_digest
        with patch("notifications.db") as mock_db, patch("notifications.email_service") as mock_email:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find_one = AsyncMock(side_effect=[
                {"id": "audit2", "user_id": "user1", "result": {"overall_score": 90, "issues": []}, "ai_recommendations": {}},
                {"id": "audit1", "user_id": "user1", "result": {"overall_score": 80}},
            ])
            mock_email.weekly_digest_html.return_value = "<html>digest</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1"})
            result = await send_weekly_digest("user1", "https://example.com")
            assert result == {"sent": True, "score": 90}
            call_kwargs = mock_email.weekly_digest_html.call_args[1]
            assert call_kwargs["score_delta"] == 10


class TestSendRankChangeAlert:
    """Tests for send_rank_change_alert()."""

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        from notifications import send_rank_change_alert
        with patch("notifications.db") as mock_db:
            mock_db.users.find_one = AsyncMock(return_value=None)
            result = await send_rank_change_alert("user1", "seo", 5, 2, "https://example.com")
            assert result == {"skipped": "user_not_found"}

    @pytest.mark.asyncio
    async def test_insignificant_change(self):
        from notifications import send_rank_change_alert
        with patch("notifications.db") as mock_db:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            result = await send_rank_change_alert("user1", "seo", 5, 6, "https://example.com")
            assert result == {"skipped": "insignificant_change"}

    @pytest.mark.asyncio
    async def test_sends_alert_moved_up(self):
        from notifications import send_rank_change_alert
        with patch("notifications.db") as mock_db, patch("notifications.email_service") as mock_email:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_email.keyword_rank_change_html.return_value = "<html>alert</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1"})
            result = await send_rank_change_alert("user1", "seo", 10, 3, "https://example.com")
            assert result == {"sent": True, "keyword": "seo", "new_rank": 3}

    @pytest.mark.asyncio
    async def test_sends_alert_moved_down(self):
        from notifications import send_rank_change_alert
        with patch("notifications.db") as mock_db, patch("notifications.email_service") as mock_email:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_email.keyword_rank_change_html.return_value = "<html>alert</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1"})
            result = await send_rank_change_alert("user1", "seo", 3, 10, "https://example.com")
            assert result == {"sent": True, "keyword": "seo", "new_rank": 10}

    @pytest.mark.asyncio
    async def test_new_keyword_no_old_rank(self):
        from notifications import send_rank_change_alert
        with patch("notifications.db") as mock_db, patch("notifications.email_service") as mock_email:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_email.keyword_rank_change_html.return_value = "<html>alert</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1"})
            result = await send_rank_change_alert("user1", "new_kw", None, 5, "https://example.com")
            assert result == {"sent": True, "keyword": "new_kw", "new_rank": 5}

    @pytest.mark.asyncio
    async def test_email_failure(self):
        from notifications import send_rank_change_alert
        with patch("notifications.db") as mock_db, patch("notifications.email_service") as mock_email:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_email.keyword_rank_change_html.return_value = "<html>alert</html>"
            mock_email.send_html_email = AsyncMock(side_effect=Exception("fail"))
            result = await send_rank_change_alert("user1", "seo", 10, 3, "https://example.com")
            assert result["sent"] is False


class TestSendCompetitorAlert:
    """Tests for send_competitor_alert()."""

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        from notifications import send_competitor_alert
        with patch("notifications.db") as mock_db:
            mock_db.users.find_one = AsyncMock(return_value=None)
            result = await send_competitor_alert("user1", "CompX", 90, 70, "https://example.com")
            assert result == {"skipped": "user_not_found"}

    @pytest.mark.asyncio
    async def test_sends_alert_successfully(self):
        from notifications import send_competitor_alert
        with patch("notifications.db") as mock_db, patch("notifications.email_service") as mock_email:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_email.competitor_alert_html.return_value = "<html>alert</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1"})
            result = await send_competitor_alert("user1", "CompX", 90, 70, "https://example.com")
            assert result == {"sent": True, "competitor": "CompX", "gap": 20}

    @pytest.mark.asyncio
    async def test_email_failure(self):
        from notifications import send_competitor_alert
        with patch("notifications.db") as mock_db, patch("notifications.email_service") as mock_email:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_email.competitor_alert_html.return_value = "<html>alert</html>"
            mock_email.send_html_email = AsyncMock(side_effect=Exception("fail"))
            result = await send_competitor_alert("user1", "CompX", 90, 70, "https://example.com")
            assert result["sent"] is False


class TestSendAuditReminder:
    """Tests for send_audit_reminder()."""

    @pytest.mark.asyncio
    async def test_user_not_found(self):
        from notifications import send_audit_reminder
        with patch("notifications.db") as mock_db:
            mock_db.users.find_one = AsyncMock(return_value=None)
            result = await send_audit_reminder("user1", "https://example.com")
            assert result == {"skipped": "user_not_found"}

    @pytest.mark.asyncio
    async def test_no_audits(self):
        from notifications import send_audit_reminder
        with patch("notifications.db") as mock_db:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find_one = AsyncMock(return_value=None)
            result = await send_audit_reminder("user1", "https://example.com")
            assert result == {"skipped": "no_audits"}

    @pytest.mark.asyncio
    async def test_recent_audit_no_reminder(self):
        from notifications import send_audit_reminder
        from datetime import datetime, timezone, timedelta
        recent = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
        with patch("notifications.db") as mock_db:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find_one = AsyncMock(return_value={"id": "audit1", "created_at": recent, "result": {"overall_score": 80}})
            result = await send_audit_reminder("user1", "https://example.com")
            assert result == {"skipped": "only_5_days"}

    @pytest.mark.asyncio
    async def test_sends_reminder_after_30_days(self):
        from notifications import send_audit_reminder
        from datetime import datetime, timezone, timedelta
        old = (datetime.now(timezone.utc) - timedelta(days=35)).isoformat()
        with patch("notifications.db") as mock_db, patch("notifications.email_service") as mock_email:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find_one = AsyncMock(return_value={"id": "audit1", "created_at": old, "result": {"overall_score": 75}})
            mock_email.audit_reminder_html.return_value = "<html>reminder</html>"
            mock_email.send_html_email = AsyncMock(return_value={"id": "msg1"})
            result = await send_audit_reminder("user1", "https://example.com")
            assert result["sent"] is True
            assert result["days_since"] >= 30

    @pytest.mark.asyncio
    async def test_invalid_date_skipped(self):
        from notifications import send_audit_reminder
        with patch("notifications.db") as mock_db:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find_one = AsyncMock(return_value={"id": "audit1", "created_at": "not-a-date", "result": {}})
            result = await send_audit_reminder("user1", "https://example.com")
            assert result == {"skipped": "invalid_date"}

    @pytest.mark.asyncio
    async def test_email_failure(self):
        from notifications import send_audit_reminder
        from datetime import datetime, timezone, timedelta
        old = (datetime.now(timezone.utc) - timedelta(days=40)).isoformat()
        with patch("notifications.db") as mock_db, patch("notifications.email_service") as mock_email:
            mock_db.users.find_one = AsyncMock(return_value={"id": "user1", "email": "a@b.com", "name": "Test"})
            mock_db.audits.find_one = AsyncMock(return_value={"id": "audit1", "created_at": old, "result": {"overall_score": 60}})
            mock_email.audit_reminder_html.return_value = "<html>reminder</html>"
            mock_email.send_html_email = AsyncMock(side_effect=Exception("fail"))
            result = await send_audit_reminder("user1", "https://example.com")
            assert result["sent"] is False


class TestRunDailyNotifications:
    """Tests for run_daily_notifications()."""

    @pytest.mark.asyncio
    async def test_no_scheduled_projects(self):
        from notifications import run_daily_notifications
        with patch("notifications.db") as mock_db:
            mock_db.projects.find.return_value.to_list = AsyncMock(return_value=[])
            result = await run_daily_notifications(mock_db, "https://example.com")
            assert result == {"digests": 0, "reminders": 0, "errors": 0}

    @pytest.mark.asyncio
    async def test_sends_reminders_for_users(self):
        from notifications import run_daily_notifications
        with patch("notifications.db") as mock_db, patch("notifications.send_audit_reminder") as mock_reminder:
            mock_db.projects.find.return_value.to_list = AsyncMock(return_value=[
                {"user_id": "user1"}, {"user_id": "user2"}, {"user_id": "user1"}
            ])
            mock_reminder.side_effect = [
                {"sent": True, "days_since": 35},
                {"skipped": "only_5_days"},
            ]
            result = await run_daily_notifications(mock_db, "https://example.com")
            assert result["reminders"] == 1
            assert result["errors"] == 0

    @pytest.mark.asyncio
    async def test_handles_errors_gracefully(self):
        from notifications import run_daily_notifications
        with patch("notifications.db") as mock_db, patch("notifications.send_audit_reminder") as mock_reminder:
            mock_db.projects.find.return_value.to_list = AsyncMock(return_value=[
                {"user_id": "user1"}
            ])
            mock_reminder.side_effect = Exception("DB error")
            result = await run_daily_notifications(mock_db, "https://example.com")
            assert result["errors"] == 1
