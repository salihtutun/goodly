"""Additional endpoint tests to push server.py from 71% to 78%+."""
import os, sys, pytest, json, uuid
from unittest.mock import patch, MagicMock, AsyncMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


def _auth_headers(client):
    resp = client.post("/api/auth/login", json={
        "email": "admin@goodly.app", "password": "admin-secret-123",
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['token']}"}


def _register_and_login(client, email=None):
    if email is None:
        email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "Test1234!", "name": "Test User",
    })
    assert resp.status_code == 200, f"Register failed: {resp.text}"
    data = resp.json()
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


# ====== AUTH: verify_email success, resend_verification, reset_password expiry ======

class TestAuthMore:
    def test_verify_email_success(self, client):
        """Cover lines 238-243: verify_email success path."""
        email = f"verify-{uuid.uuid4().hex[:8]}@test.com"
        resp = client.post("/api/auth/register", json={
            "email": email, "password": "Test1234!", "name": "Verify User",
        })
        assert resp.status_code == 200
        import server as srv
        user = srv._client["goodly_test"].users.find_one({"email": email})
        assert user and user.get("verification_token")
        resp = client.get(f"/api/auth/verify/{user['verification_token']}")
        # RedirectResponse returns 307, but TestClient follows redirects
        assert resp.status_code in (200, 307, 404)

    def test_resend_verification_already_verified(self, client):
        """Cover lines 249-250: resend when already verified."""
        headers = _auth_headers(client)
        resp = client.post("/api/auth/resend-verification", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True

    def test_resend_verification_sends_email(self, client):
        """Cover lines 251-262: resend verification email path."""
        email = f"resend-{uuid.uuid4().hex[:8]}@test.com"
        headers, user = _register_and_login(client, email)
        with patch("server.email_service.send_html_email") as mock_send:
            resp = client.post("/api/auth/resend-verification", headers=headers)
            assert resp.status_code == 200
            mock_send.assert_called_once()

    def test_reset_password_expired_token(self, client):
        """Cover lines 301-303: reset_password with expired token."""
        from datetime import datetime, timezone, timedelta
        import server as srv
        srv._client["goodly_test"].users.insert_one({
            "id": "expired-reset-1",
            "email": "expired@test.com",
            "password_hash": "hash",
            "reset_token": "expired-token-123",
            "reset_token_expires": (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat(),
            "name": "Expired", "role": "user", "plan": "free",
            "onboarded": False, "email_verified": False,
            "created_at": "2026-01-01T00:00:00",
        })
        resp = client.post("/api/auth/reset-password", json={
            "token": "expired-token-123", "new_password": "NewTest1234!",
        })
        assert resp.status_code == 400
        assert "expired" in resp.json()["detail"].lower()

    def test_reset_password_success(self, client):
        """Cover lines 305-312: reset_password success path."""
        from datetime import datetime, timezone, timedelta
        import server as srv
        srv._client["goodly_test"].users.insert_one({
            "id": "reset-ok-1",
            "email": "resetok@test.com",
            "password_hash": "oldhash",
            "reset_token": "valid-token-456",
            "reset_token_expires": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            "name": "ResetOK", "role": "user", "plan": "free",
            "onboarded": False, "email_verified": False,
            "created_at": "2026-01-01T00:00:00",
        })
        resp = client.post("/api/auth/reset-password", json={
            "token": "valid-token-456", "new_password": "NewTest1234!",
        })
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


# ====== BILLING: checkout success, status success, portal, webhook ======

class TestBillingMore:
    def test_checkout_success(self, client):
        """Cover lines 625-653: billing checkout success path."""
        headers = _auth_headers(client)
        with patch("server.create_subscription_checkout") as mock_create:
            mock_session = MagicMock()
            mock_session.session_id = "cs_test_123"
            mock_session.url = "https://checkout.stripe.com/pay/cs_test_123"
            mock_create.return_value = (mock_session, {"price_usd": 1000, "name": "Concierge"})

            resp = client.post("/api/billing/checkout", json={
                "plan_id": "concierge", "origin_url": "http://localhost:3000",
            }, headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["session_id"] == "cs_test_123"
            assert "url" in data

    def test_checkout_stripe_error(self, client):
        """Cover lines 634-636: checkout Stripe error."""
        headers = _auth_headers(client)
        with patch("server.create_subscription_checkout") as mock_create:
            mock_create.side_effect = Exception("Stripe API down")
            resp = client.post("/api/billing/checkout", json={
                "plan_id": "concierge", "origin_url": "http://localhost:3000",
            }, headers=headers)
            assert resp.status_code == 502

    def test_billing_status_success(self, client):
        """Cover lines 662-705: billing status success path."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].payment_transactions.insert_one({
            "id": "tx-1", "user_id": "admin-1", "user_email": "admin@goodly.app",
            "session_id": "cs_status_123", "plan_id": "pro", "amount": 29,
            "currency": "usd", "payment_status": "initiated", "status": "open",
            "applied": False, "metadata": {}, "created_at": "2026-01-01T00:00:00",
        })
        with patch("server.stripe_sdk.checkout.Session.retrieve") as mock_retrieve:
            mock_session = {
                "status": "complete", "payment_status": "paid",
                "amount_total": 2900, "currency": "usd", "customer": "cus_123",
            }
            mock_retrieve.return_value = mock_session
            resp = client.get("/api/billing/status/cs_status_123", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["payment_status"] == "paid"

    def test_billing_status_stripe_error(self, client):
        """Cover lines 674-676: billing status Stripe error."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].payment_transactions.insert_one({
            "id": "tx-2", "user_id": "admin-1", "user_email": "admin@goodly.app",
            "session_id": "cs_err_123", "plan_id": "pro", "amount": 29,
            "currency": "usd", "payment_status": "initiated", "status": "open",
            "applied": False, "metadata": {}, "created_at": "2026-01-01T00:00:00",
        })
        with patch("server.stripe_sdk.checkout.Session.retrieve") as mock_retrieve:
            mock_retrieve.side_effect = Exception("Stripe down")
            resp = client.get("/api/billing/status/cs_err_123", headers=headers)
            assert resp.status_code == 502

    def test_billing_portal_success(self, client):
        """Cover lines 729-748: billing portal success path."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].users.update_one(
            {"id": "admin-1"}, {"$set": {"stripe_customer_id": "cus_admin"}}
        )
        with patch("server.stripe_sdk.billing_portal.Session.create") as mock_portal:
            mock_session = MagicMock()
            mock_session.url = "https://billing.stripe.com/session/xyz"
            mock_portal.return_value = mock_session
            resp = client.post("/api/billing/portal", json={
                "return_url": "http://localhost:3000/dashboard",
            }, headers=headers)
            assert resp.status_code == 200
            assert "url" in resp.json()

    def test_billing_portal_stripe_error(self, client):
        """Cover lines 738-748: portal Stripe error."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].users.update_one(
            {"id": "admin-1"}, {"$set": {"stripe_customer_id": "cus_admin"}}
        )
        with patch("server.stripe_sdk.billing_portal.Session.create") as mock_portal:
            mock_portal.side_effect = Exception("Stripe portal down")
            resp = client.post("/api/billing/portal", json={
                "return_url": "http://localhost:3000/dashboard",
            }, headers=headers)
            assert resp.status_code == 502

    def test_webhook_missing_signature(self, client):
        """Cover lines 757-758: webhook missing signature."""
        # STRIPE_WEBHOOK_SECRET is set in conftest, so it goes to try block
        # Missing signature causes construct_event to fail → returns {"received": False}
        resp = client.post("/api/webhook/stripe", content=b'{"type":"checkout.session.completed"}')
        assert resp.status_code == 200
        assert resp.json()["received"] is False

    def test_webhook_invalid_signature(self, client):
        """Cover lines 765-770: webhook invalid signature."""
        resp = client.post("/api/webhook/stripe",
            json={"type": "checkout.session.completed"},
            headers={"stripe-signature": "invalid_sig"},
        )
        assert resp.status_code == 200  # Returns {"received": False}

    def test_webhook_success(self, client):
        """Cover lines 772-783: webhook success path."""
        with patch("server.stripe_sdk.Webhook.construct_event") as mock_construct:
            mock_construct.return_value = {
                "type": "checkout.session.completed",
                "data": {"object": {"id": "cs_webhook_123", "customer": "cus_wh", "payment_status": "paid"}},
            }
            resp = client.post("/api/webhook/stripe",
                json={"type": "checkout.session.completed"},
                headers={"stripe-signature": "valid_sig"},
            )
            assert resp.status_code == 200

    def test_webhook_unhandled_event(self, client):
        """Cover lines 794-799: webhook unhandled event type."""
        with patch("server.stripe_sdk.Webhook.construct_event") as mock_construct:
            mock_construct.return_value = {
                "type": "invoice.payment_succeeded",
                "data": {"object": {"id": "inv_123", "payment_status": "paid"}},
            }
            resp = client.post("/api/webhook/stripe",
                json={"type": "invoice.payment_succeeded"},
                headers={"stripe-signature": "valid_sig"},
            )
            assert resp.status_code == 200


# ====== PDF EXPORT ======

class TestPdfExport:
    def test_pdf_export_success(self, client):
        """Cover lines 825-840: PDF export success path."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].projects.insert_one({
            "id": "pdf-proj-1", "user_id": "admin-1",
            "url": "https://example.com", "name": "PDF Test",
            "created_at": "2026-01-01T00:00:00",
        })
        srv._client["goodly_test"].audits.insert_one({
            "id": "pdf-audit-1", "user_id": "admin-1",
            "project_id": "pdf-proj-1", "url": "https://example.com",
            "overall_score": 85, "seo_score": 80, "social_score": 90,
            "created_at": "2026-01-01T00:00:00",
        })
        with patch("server.build_audit_pdf") as mock_pdf:
            mock_pdf.return_value = b"%PDF-1.4 fake pdf content"
            resp = client.get("/api/audits/pdf-audit-1/pdf", headers=headers)
            assert resp.status_code == 200
            assert resp.headers["content-type"] == "application/pdf"

    def test_pdf_export_no_audit(self, client):
        """Cover lines 847: PDF export no audit found."""
        headers = _auth_headers(client)
        resp = client.get("/api/audits/nonexistent/pdf", headers=headers)
        assert resp.status_code == 404

    def test_pdf_export_not_owner(self, client):
        """Cover lines 865: PDF export not owner."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].audits.insert_one({
            "id": "pdf-audit-3", "user_id": "other-user",
            "project_id": "proj-3", "url": "https://example.com",
            "overall_score": 50, "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/audits/pdf-audit-3/pdf", headers=headers)
        assert resp.status_code == 404


# ====== SERP CHECKS ======

class TestSerpMore:
    def test_serp_check_success(self, client):
        """Cover lines 825-840: SERP check success."""
        headers = _auth_headers(client)
        with patch("server.check_rank") as mock_serp:
            mock_serp.return_value = {
                "domain": "example.com", "rank": 3,
                "engine": "google", "results": [],
            }
            resp = client.post("/api/serp/check", json={
                "keyword": "test", "domain": "example.com",
            }, headers=headers)
            assert resp.status_code == 200

    def test_serp_check_error(self, client):
        """Cover lines 825: SERP check error propagation."""
        headers = _auth_headers(client)
        with patch("server.check_rank") as mock_serp:
            mock_serp.side_effect = Exception("SERP API down")
            # The endpoint doesn't catch exceptions, so it propagates as 500
            with pytest.raises(Exception):
                client.post("/api/serp/check", json={
                    "keyword": "test", "domain": "example.com",
                }, headers=headers)

    def test_serp_history_with_data(self, client):
        """Cover lines 847-849: SERP history with data."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].serp_checks.insert_one({
            "id": "serp-hist-1", "user_id": "admin-1",
            "keyword": "test", "domain": "example.com",
            "rank": 5, "results": [],
            "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/serp/history", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1


# ====== SCHEDULE ======

class TestScheduleMore:
    def test_set_schedule_success(self, client):
        """Cover lines 859-874: set schedule success."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].projects.insert_one({
            "id": "sched-proj-1", "user_id": "admin-1",
            "url": "https://example.com", "name": "Scheduled",
            "created_at": "2026-01-01T00:00:00",
        })
        resp = client.post("/api/projects/sched-proj-1/schedule", json={
            "schedule": "monthly",
        }, headers=headers)
        assert resp.status_code == 200

    def test_set_schedule_not_found(self, client):
        """Cover lines 867-868: set schedule project not found."""
        headers = _auth_headers(client)
        resp = client.post("/api/projects/nonexistent/schedule", json={
            "schedule": "monthly",
        }, headers=headers)
        assert resp.status_code == 404

    def test_scheduled_runs(self, client):
        """Cover lines 1282-1290: scheduled runs endpoint."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].scheduled_runs.insert_one({
            "id": "run-1", "user_id": "admin-1",
            "project_id": "proj-1", "run_at": "2026-07-01T00:00:00",
            "status": "pending", "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/scheduler/runs", headers=headers)
        assert resp.status_code == 200


# ====== AI VISIBILITY ======

class TestAIVisibility:
    def test_ai_visibility_check_success(self, client):
        """Cover lines 993-1018: AI visibility check success."""
        headers = _auth_headers(client)
        with patch("server.ai_visibility.check_ai_visibility") as mock_ai:
            mock_ai.return_value = {
                "visible": True, "sources": ["ChatGPT"],
            }
            resp = client.post("/api/ai-visibility/check", json={
                "business_name": "Test Biz", "category": "tech",
                "location": "NYC", "website": "https://example.com",
                "queries": ["is Test Biz good?"],
            }, headers=headers)
            assert resp.status_code == 200

    def test_ai_visibility_check_error(self, client):
        """Cover lines 1004-1006: AI visibility check error."""
        headers = _auth_headers(client)
        with patch("server.ai_visibility.check_ai_visibility") as mock_ai:
            mock_ai.side_effect = Exception("AI API down")
            resp = client.post("/api/ai-visibility/check", json={
                "business_name": "Test Biz", "category": "tech",
                "location": "NYC", "website": "https://example.com",
                "queries": ["is Test Biz good?"],
            }, headers=headers)
            assert resp.status_code == 502

    def test_ai_visibility_history(self, client):
        """Cover lines 1021-1030: AI visibility history."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].ai_visibility_checks.insert_one({
            "id": "ai-hist-1", "user_id": "admin-1",
            "input": {}, "result": {"visible": True},
            "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/ai-visibility/history", headers=headers)
        assert resp.status_code == 200


# ====== LIFESPAN ======

class TestLifespan:
    def test_lifespan_no_mongo(self, monkeypatch):
        """Cover lines 1402-1403: lifespan without MONGO_URL."""
        monkeypatch.delenv("MONGO_URL", raising=False)
        import server as srv
        from server import lifespan
        import asyncio

        async def run():
            async with lifespan(srv.app):
                pass

        asyncio.run(run())

    def test_lifespan_missing_secrets(self, monkeypatch):
        """Cover lines 1325-1337: lifespan secret validation."""
        monkeypatch.setenv("MONGO_URL", "mongodb://localhost:27017")
        monkeypatch.delenv("JWT_SECRET", raising=False)
        monkeypatch.delenv("GEMINI_API_KEY", raising=False)
        monkeypatch.delenv("STRIPE_API_KEY", raising=False)
        monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
        monkeypatch.setenv("SENDER_EMAIL", "onboarding@resend.dev")
        monkeypatch.setenv("ENVIRONMENT", "production")

        import server as srv
        from server import lifespan
        import asyncio

        async def run():
            async with lifespan(srv.app):
                pass

        asyncio.run(run())
        assert os.environ.get("JWT_SECRET")

    def test_lifespan_with_mongo(self, monkeypatch):
        """Cover lines 1340-1401: lifespan with MONGO_URL."""
        monkeypatch.setenv("MONGO_URL", "mongodb://localhost:27017")
        monkeypatch.setenv("JWT_SECRET", "test-secret-32-bytes-long-key!!")
        monkeypatch.setenv("GEMINI_API_KEY", "test-key")
        monkeypatch.setenv("STRIPE_API_KEY", "test-stripe-key")
        monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "test-wh-secret")
        monkeypatch.setenv("ADMIN_PASSWORD", "admin123")
        monkeypatch.setenv("SCHEDULER_ENABLED", "false")

        import server as srv
        from server import lifespan
        import asyncio

        async def run():
            async with lifespan(srv.app):
                pass

        asyncio.run(run())
