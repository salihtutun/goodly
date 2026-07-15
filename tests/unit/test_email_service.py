"""Unit tests for email_service.py — HTML template functions and send_html_email."""
import pytest
from unittest.mock import AsyncMock, patch


class TestIsConfigured:
    def test_configured(self):
        with patch("os.environ.get", return_value="fake-key"):
            from email_service import is_configured
            assert is_configured() is True

    def test_not_configured(self):
        with patch("os.environ.get", return_value=""):
            from email_service import is_configured
            assert is_configured() is False


class TestSendHtmlEmail:
    @pytest.mark.asyncio
    async def test_mocked_when_no_api_key(self):
        with patch("os.environ.get", side_effect=lambda k, d=None: "" if k == "RESEND_API_KEY" else d):
            from email_service import send_html_email
            result = await send_html_email(to="a@b.com", subject="Test", html="<p>hi</p>")
            assert result["mocked"] is True
            assert result["id"] is None

    @pytest.mark.asyncio
    async def test_sends_with_api_key(self):
        with patch("os.environ.get", side_effect=lambda k, d=None: "fake-key" if k == "RESEND_API_KEY" else (d or "sender@test.com")):
            with patch("email_service.asyncio.to_thread") as mock_thread:
                from email_service import send_html_email
                mock_thread.return_value = {"id": "email-123"}
                result = await send_html_email(to="a@b.com", subject="Test", html="<p>hi</p>")
                assert result["mocked"] is False
                assert result["id"] == "email-123"

    @pytest.mark.asyncio
    async def test_handles_resend_error(self):
        with patch("os.environ.get", side_effect=lambda k, d=None: "fake-key" if k == "RESEND_API_KEY" else (d or "sender@test.com")):
            with patch("email_service.asyncio.to_thread") as mock_thread:
                from email_service import send_html_email
                mock_thread.side_effect = Exception("Resend API error")
                result = await send_html_email(to="a@b.com", subject="Test", html="<p>hi</p>")
                assert result["mocked"] is False
                assert result["id"] is None
                assert "Resend API error" in result["error"]


class TestVerifyEmailHtml:
    def test_with_name(self):
        from email_service import verify_email_html
        html = verify_email_html(name="John", verify_link="https://example.com/verify?token=abc")
        assert "John" in html
        assert "https://example.com/verify?token=abc" in html
        assert "Verify your email" in html

    def test_without_name(self):
        from email_service import verify_email_html
        html = verify_email_html(name="", verify_link="https://example.com/verify")
        assert "Verify your email" in html


class TestResetPasswordHtml:
    def test_generates_html(self):
        from email_service import reset_password_html
        html = reset_password_html(name="Jane", reset_link="https://example.com/reset?token=xyz")
        assert "Jane" in html
        assert "https://example.com/reset?token=xyz" in html
        assert "Reset your password" in html


class TestAuditDigestHtml:
    def test_score_improved(self):
        from email_service import audit_digest_html
        html = audit_digest_html(
            name="Test", project_name="My Site", url="https://mysite.com",
            overall_score=85, prev_score=75, top_issues=[], audit_url="https://app.com/audit/1"
        )
        assert "85" in html
        assert "My Site" in html
        assert "↑ 10 pts" in html

    def test_score_declined(self):
        from email_service import audit_digest_html
        html = audit_digest_html(
            name="Test", project_name="My Site", url="https://mysite.com",
            overall_score=70, prev_score=80, top_issues=[], audit_url="https://app.com/audit/1"
        )
        assert "↓ 10 pts" in html

    def test_no_change(self):
        from email_service import audit_digest_html
        html = audit_digest_html(
            name="Test", project_name="My Site", url="https://mysite.com",
            overall_score=80, prev_score=80, top_issues=[], audit_url="https://app.com/audit/1"
        )
        assert "No change" in html

    def test_no_previous_score(self):
        from email_service import audit_digest_html
        html = audit_digest_html(
            name="Test", project_name="My Site", url="https://mysite.com",
            overall_score=80, prev_score=None, top_issues=[], audit_url="https://app.com/audit/1"
        )
        assert "80" in html

    def test_with_issues(self):
        from email_service import audit_digest_html
        issues = [
            {"severity": "high", "message": "Missing H1", "fix": "Add H1 tag"},
            {"severity": "medium", "message": "Slow page", "fix": "Optimize images"},
        ]
        html = audit_digest_html(
            name="Test", project_name="My Site", url="https://mysite.com",
            overall_score=60, prev_score=70, top_issues=issues, audit_url="https://app.com/audit/1"
        )
        assert "Missing H1" in html
        assert "Add H1 tag" in html
        assert "HIGH" in html
        assert "MEDIUM" in html


class TestPostAuditHtml:
    def test_generates_html(self):
        from email_service import post_audit_html
        html = post_audit_html(
            name="Test", url="https://mysite.com", overall_score=75,
            high_issues=3, audit_url="https://app.com/audit/1"
        )
        assert "75" in html
        assert "3" in html
        assert "mysite.com" in html


class TestWeeklyTipsHtml:
    def test_with_tips(self):
        from email_service import weekly_tips_html
        tips = [{"title": "Tip 1", "body": "Do this"}, {"title": "Tip 2", "body": "Do that"}]
        html = weekly_tips_html(name="Test", tips=tips, dashboard_url="https://app.com")
        assert "Tip 1" in html
        assert "Do this" in html

    def test_empty_tips(self):
        from email_service import weekly_tips_html
        html = weekly_tips_html(name="Test", tips=[], dashboard_url="https://app.com")
        assert "Run an audit" in html


class TestReferralInviteHtml:
    def test_generates_html(self):
        from email_service import referral_invite_html
        html = referral_invite_html(referrer_name="Alice", referral_link="https://example.com/ref/abc")
        assert "Alice" in html
        assert "https://example.com/ref/abc" in html


class TestSupportNotificationHtml:
    def test_generates_html(self):
        from email_service import support_notification_html
        html = support_notification_html(
            name="User", email="user@test.com", message="Help me!", page="/dashboard"
        )
        assert "User" in html
        assert "user@test.com" in html
        assert "Help me!" in html

    def test_escapes_html(self):
        from email_service import support_notification_html
        html = support_notification_html(
            name="<script>alert(1)</script>", email="x@x.com", message="<b>bold</b>", page="/"
        )
        assert "<script>" not in html
        assert "&lt;script&gt;" in html


class TestOnboardingEmails:
    def test_welcome_html(self):
        from email_service import onboarding_welcome_html
        html = onboarding_welcome_html(name="New User", dashboard_url="https://app.com")
        assert "New User" in html
        assert "Welcome to Goodly" in html

    def test_howto_html(self):
        from email_service import onboarding_howto_html
        html = onboarding_howto_html(name="User", dashboard_url="https://app.com")
        assert "How to read your audit report" in html

    def test_quickwins_html(self):
        from email_service import onboarding_quickwins_html
        html = onboarding_quickwins_html(name="User", dashboard_url="https://app.com")
        assert "3 quick wins" in html

    def test_competitors_html(self):
        from email_service import onboarding_competitors_html
        html = onboarding_competitors_html(name="User", dashboard_url="https://app.com")
        assert "competitors" in html.lower()

    def test_upgrade_html(self):
        from email_service import onboarding_upgrade_html
        html = onboarding_upgrade_html(name="User", billing_url="https://app.com/billing")
        assert "3 free audits" in html


class TestRankChangeHtml:
    def test_score_up(self):
        from email_service import rank_change_html
        html = rank_change_html(name="Test", project_name="Site", score_delta=10, current_score=85, audit_url="https://app.com/a/1")
        assert "went up" in html
        assert "85" in html

    def test_score_down(self):
        from email_service import rank_change_html
        html = rank_change_html(name="Test", project_name="Site", score_delta=-5, current_score=70, audit_url="https://app.com/a/1")
        assert "went down" in html
        assert "70" in html


class TestWeeklyDigestHtml:
    def test_with_delta(self):
        from email_service import weekly_digest_html
        html = weekly_digest_html(name="Test", current_score=80, score_delta=5, audit_url="https://app.com/a/1")
        assert "80" in html
        assert "went up" in html

    def test_steady_score(self):
        from email_service import weekly_digest_html
        html = weekly_digest_html(name="Test", current_score=80, prev_score=80, audit_url="https://app.com/a/1")
        assert "held steady" in html

    def test_with_issues_and_actions(self):
        from email_service import weekly_digest_html
        html = weekly_digest_html(
            name="Test", current_score=70,
            critical_issues=[{"title": "Missing H1"}, {"message": "Slow page"}],
            priority_actions=["Fix meta tags", "Add alt text"],
            audit_url="https://app.com/a/1"
        )
        assert "Missing H1" in html
        assert "Fix meta tags" in html


class TestKeywordRankChangeHtml:
    def test_moved_up(self):
        from email_service import keyword_rank_change_html
        html = keyword_rank_change_html(name="Test", keyword="seo tools", old_rank=10, new_rank=3, direction="up", serp_url="https://app.com/serp")
        assert "seo tools" in html
        assert "moved up" in html
        assert "was #10" in html

    def test_moved_down(self):
        from email_service import keyword_rank_change_html
        html = keyword_rank_change_html(name="Test", keyword="seo tools", old_rank=3, new_rank=10, direction="down", serp_url="https://app.com/serp")
        assert "dropped" in html

    def test_no_old_rank(self):
        from email_service import keyword_rank_change_html
        html = keyword_rank_change_html(name="Test", keyword="new kw", old_rank=None, new_rank=5, direction="up")
        assert "was #" not in html


class TestCompetitorAlertHtml:
    def test_generates_html(self):
        from email_service import competitor_alert_html
        html = competitor_alert_html(name="Test", competitor_name="CompX", competitor_score=90, your_score=70, gap=20, competitors_url="https://app.com/competitors")
        assert "CompX" in html
        assert "20 points" in html
        assert "90" in html
        assert "70" in html


class TestAuditReminderHtml:
    def test_generates_html(self):
        from email_service import audit_reminder_html
        html = audit_reminder_html(name="Test", days_since=35, last_score=65, audit_url="https://app.com/audit")
        assert "35 days" in html
        assert "65" in html


class TestNurtureEmails:
    def test_nurture_1(self):
        from email_service import nurture_email_1_html
        html = nurture_email_1_html(name="Test", score=55, issues_count=12, top_issue="Missing meta description", audit_url="https://app.com/audit")
        assert "55" in html
        assert "12 issues" in html
        assert "Missing meta description" in html

    def test_nurture_2(self):
        from email_service import nurture_email_2_html
        html = nurture_email_2_html(name="Test", score=55, quick_wins=[{"title": "Fix H1", "detail": "Add H1 tag"}], signup_url="https://app.com/register")
        assert "Fix H1" in html
        assert "Add H1 tag" in html

    def test_nurture_3(self):
        from email_service import nurture_email_3_html
        html = nurture_email_3_html(name="Test", signup_url="https://app.com/register")
        assert "free trial" in html


class TestTrialEmails:
    def test_trial_ending(self):
        from email_service import trial_ending_html
        html = trial_ending_html(name="Test", plan_name="Starter", days_left=2, billing_url="https://app.com/billing")
        assert "2 days" in html
        assert "Starter" in html

    def test_trial_expired(self):
        from email_service import trial_expired_html
        html = trial_expired_html(name="Test", plan_name="Pro", billing_url="https://app.com/billing")
        assert "has ended" in html
        assert "Pro" in html


class TestPaymentFailedHtml:
    def test_generates_html(self):
        from email_service import payment_failed_html
        html = payment_failed_html(name="Test", billing_url="https://app.com/billing")
        assert "Payment issue" in html


class TestMonthlyRoiHtml:
    def test_score_up(self):
        from email_service import monthly_roi_html
        html = monthly_roi_html(name="Test", current_score=85, score_delta=10, estimated_revenue_saved=5000, audits_run=8, issues_fixed=4, dashboard_url="https://app.com")
        assert "85" in html
        assert "up" in html
        assert "5,000" in html

    def test_score_down(self):
        from email_service import monthly_roi_html
        html = monthly_roi_html(name="Test", current_score=70, score_delta=-5, estimated_revenue_saved=0, audits_run=3, issues_fixed=0, dashboard_url="https://app.com")
        assert "down" in html


class TestReengagementHtml:
    def test_generates_html(self):
        from email_service import reengagement_html
        html = reengagement_html(name="Test", days_inactive=21, last_score=60, dashboard_url="https://app.com")
        assert "21 days" in html
        assert "60" in html
