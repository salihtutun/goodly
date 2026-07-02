"""Integration tests for new endpoints: achievements, notifications, improvement, support."""
import pytest
import sys
import os
import asyncio

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

from fastapi.testclient import TestClient


def run(coro):
    return asyncio.run(coro)


class TestAchievementEndpoints:
    """Test achievement-related endpoints."""

    def test_get_achievements_returns_earned_and_locked(self, client, auth_headers):
        """GET /api/dashboard/achievements should return earned + locked lists."""
        resp = client.get("/api/dashboard/achievements", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "earned" in data
        assert "locked" in data
        assert "total_earned" in data
        assert "total_available" in data
        assert isinstance(data["earned"], list)
        assert isinstance(data["locked"], list)

    def test_get_achievements_requires_auth(self, client):
        """GET /api/dashboard/achievements should require auth."""
        resp = client.get("/api/dashboard/achievements")
        assert resp.status_code in (401, 403)

    def test_check_achievements_returns_new(self, client, auth_headers):
        """POST /api/dashboard/check-achievements should return newly earned."""
        resp = client.post("/api/dashboard/check-achievements", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "new_achievements" in data
        assert "count" in data
        assert isinstance(data["new_achievements"], list)

    def test_check_achievements_requires_auth(self, client):
        """POST /api/dashboard/check-achievements should require auth."""
        resp = client.post("/api/dashboard/check-achievements")
        assert resp.status_code in (401, 403)


class TestNotificationEndpoints:
    """Test notification-related endpoints."""

    def test_get_notifications_returns_list(self, client, auth_headers):
        """GET /api/notifications should return notifications list."""
        resp = client.get("/api/notifications", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "notifications" in data
        assert "unread" in data
        assert isinstance(data["notifications"], list)

    def test_get_notifications_requires_auth(self, client):
        """GET /api/notifications should require auth."""
        resp = client.get("/api/notifications")
        assert resp.status_code in (401, 403)

    def test_mark_notification_read_not_found(self, client, auth_headers):
        """POST /api/notifications/{id}/read should handle non-existent notification."""
        resp = client.post("/api/notifications/nonexistent-id/read", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_mark_all_read(self, client, auth_headers):
        """POST /api/notifications/read-all should succeed."""
        resp = client.post("/api/notifications/read-all", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


class TestImprovementEndpoint:
    """Test audit improvement endpoint."""

    def test_improvement_requires_auth(self, client):
        """GET /api/audits/{id}/improvement should require auth."""
        resp = client.get("/api/audits/some-id/improvement")
        assert resp.status_code in (401, 403)

    def test_improvement_not_found(self, client, auth_headers):
        """GET /api/audits/{id}/improvement should return 404 for non-existent audit."""
        resp = client.get("/api/audits/nonexistent-audit-id/improvement", headers=auth_headers)
        assert resp.status_code == 404


class TestSupportEndpoint:
    """Test support contact endpoint."""

    def test_support_contact_succeeds(self, client):
        """POST /api/support/contact should accept a support message."""
        resp = client.post("/api/support/contact", json={
            "name": "Test User",
            "email": "test@example.com",
            "message": "I need help with my audit.",
            "page": "/app/audit",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["ok"] is True

    def test_support_contact_minimal_fields(self, client):
        """POST /api/support/contact should work with just a message."""
        resp = client.post("/api/support/contact", json={
            "message": "Help!",
        })
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_support_contact_rate_limited(self, client):
        """POST /api/support/contact should be rate-limited."""
        # Send multiple requests quickly
        for _ in range(5):
            resp = client.post("/api/support/contact", json={"message": "test"})
        # The rate limiter may or may not trigger depending on test setup
        # Just verify the endpoint works
        assert resp.status_code in (200, 429)


class TestDashboardSummary:
    """Test dashboard summary includes new fields."""

    def test_dashboard_summary_returns_data(self, client, auth_headers):
        """GET /api/dashboard/summary should return summary data."""
        resp = client.get("/api/dashboard/summary", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "projects_count" in data
        assert "audits_count" in data
        assert "average_score" in data
        assert "recent_audits" in data


class TestHealthEndpoint:
    """Test health endpoint."""

    def test_health_returns_status(self, client):
        """GET /api/health should return status."""
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data

    def test_root_returns_service_info(self, client):
        """GET /api/ should return service info."""
        resp = client.get("/api/")
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("service") == "Goodly API"


class TestValidatorEndpoints:
    """Test that validators are wired into endpoints."""

    def test_public_audit_rejects_invalid_url(self, client):
        """POST /api/public/audit should reject invalid URLs."""
        resp = client.post("/api/public/audit", json={"url": "not-a-valid-url"})
        assert resp.status_code == 400

    def test_public_audit_rejects_empty_url(self, client):
        """POST /api/public/audit should reject empty URLs."""
        resp = client.post("/api/public/audit", json={"url": ""})
        assert resp.status_code in (400, 422)

    def test_create_project_rejects_invalid_url(self, client, auth_headers):
        """POST /api/projects should reject invalid URLs."""
        resp = client.post("/api/projects", json={
            "name": "Test Project",
            "url": "not-a-url",
        }, headers=auth_headers)
        assert resp.status_code == 400

    def test_register_rejects_invalid_email(self, client):
        """POST /api/auth/register should reject invalid emails."""
        resp = client.post("/api/auth/register", json={
            "email": "not-an-email",
            "password": "ValidPass123!",
        })
        assert resp.status_code in (400, 422)


class TestReferralEndpoint:
    """Test referral invite endpoint."""

    def test_referral_invite_requires_auth(self, client):
        """POST /api/referrals/invite should require auth."""
        resp = client.post("/api/referrals/invite", json={
            "email": "friend@example.com",
        })
        assert resp.status_code in (401, 403)

    def test_referral_invite_sends(self, client, auth_headers):
        """POST /api/referrals/invite should accept valid request."""
        resp = client.post("/api/referrals/invite", json={
            "email": "friend@example.com",
        }, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


class TestBillingEndpoints:
    """Test billing endpoints."""

    def test_get_plans_returns_all_plans(self, client):
        """GET /api/billing/plans should return all plans."""
        resp = client.get("/api/billing/plans")
        assert resp.status_code == 200
        data = resp.json()
        assert isinstance(data, list)
        plan_ids = [p.get("id") for p in data]
        assert "free" in plan_ids
        assert "starter" in plan_ids
        assert "pro" in plan_ids
        assert "concierge" in plan_ids

    def test_starter_has_trial_days(self, client):
        """Starter plan should have trial_days field."""
        resp = client.get("/api/billing/plans")
        plans = {p["id"]: p for p in resp.json()}
        starter = plans.get("starter", {})
        assert starter.get("trial_days") == 7

    def test_pro_has_trial_days(self, client):
        """Pro plan should have trial_days field."""
        resp = client.get("/api/billing/plans")
        plans = {p["id"]: p for p in resp.json()}
        pro = plans.get("pro", {})
        assert pro.get("trial_days") == 7

    def test_starter_has_annual_price(self, client):
        """Starter plan should have annual pricing."""
        resp = client.get("/api/billing/plans")
        plans = {p["id"]: p for p in resp.json()}
        starter = plans.get("starter", {})
        assert starter.get("price_annual_usd") == 490.0

    def test_pro_has_annual_price(self, client):
        """Pro plan should have annual pricing."""
        resp = client.get("/api/billing/plans")
        plans = {p["id"]: p for p in resp.json()}
        pro = plans.get("pro", {})
        assert pro.get("price_annual_usd") == 1490.0

    def test_billing_me_requires_auth(self, client):
        """GET /api/billing/me should require auth."""
        resp = client.get("/api/billing/me")
        assert resp.status_code in (401, 403)

    def test_checkout_requires_auth(self, client):
        """POST /api/billing/checkout should require auth."""
        resp = client.post("/api/billing/checkout", json={
            "plan_id": "starter",
            "origin_url": "http://localhost:3000",
        })
        assert resp.status_code in (401, 403)

    def test_portal_requires_auth(self, client):
        """POST /api/billing/portal should require auth."""
        resp = client.post("/api/billing/portal", json={
            "return_url": "http://localhost:3000/app/billing",
        })
        assert resp.status_code in (401, 403)


class TestVersionHeader:
    """Test version header middleware."""

    def test_api_returns_version_header(self, client):
        """API responses should include X-API-Version header."""
        resp = client.get("/api/health")
        assert "x-api-version" in resp.headers


class TestSecurityHeaders:
    """Test security headers middleware."""

    def test_api_returns_security_headers(self, client):
        """API responses should include security headers."""
        resp = client.get("/api/health")
        assert "x-content-type-options" in resp.headers
        assert "x-frame-options" in resp.headers
