"""Final push: server.py 95%→97%+ — targeted gap tests."""
import os, sys, pytest, json, uuid
from unittest.mock import patch, MagicMock, AsyncMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


def _auth_headers(client):
    resp = client.post("/api/auth/login", json={
        "email": "admin@searchgoodly.com", "password": "admin-secret-123",
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['token']}"}


# ====== EMAIL FAILURE HANDLERS ======

class TestEmailFailures:
    def test_register_email_failure(self, client):
        """Cover lines 199-200: verification email failure during register."""
        with patch("server.email_service.send_html_email") as mock_send:
            mock_send.side_effect = Exception("SMTP down")
            resp = client.post("/api/auth/register", json={
                "email": f"emailfail-{uuid.uuid4().hex[:8]}@test.com",
                "password": "Test1234!", "name": "Email Fail",
            })
            # Registration should still succeed (email is best-effort)
            assert resp.status_code == 200
            assert "token" in resp.json()

    def test_resend_verification_email_failure(self, client):
        """Cover lines 260-261: resend verification email failure."""
        email = f"resendfail-{uuid.uuid4().hex[:8]}@test.com"
        resp = client.post("/api/auth/register", json={
            "email": email, "password": "Test1234!", "name": "Resend Fail",
        })
        token = resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        with patch("server.email_service.send_html_email") as mock_send:
            mock_send.side_effect = Exception("SMTP down")
            resp = client.post("/api/auth/resend-verification", headers=headers)
            assert resp.status_code == 200
            assert resp.json()["ok"] is True

    def test_forgot_password_email_failure(self, client):
        """Cover lines 288-289: forgot password email failure."""
        with patch("server.email_service.send_html_email") as mock_send:
            mock_send.side_effect = Exception("SMTP down")
            resp = client.post("/api/auth/forgot-password", json={
                "email": "admin@searchgoodly.com",
            })
            assert resp.status_code == 200
            assert resp.json()["ok"] is True


# ====== PROJECT UPDATE NOT FOUND ======

class TestProjectUpdateNotFound:
    def test_update_project_not_found(self, client):
        """Cover line 379: update project not found."""
        headers = _auth_headers(client)
        resp = client.patch("/api/projects/nonexistent-id", json={
            "name": "New Name",
        }, headers=headers)
        assert resp.status_code == 404


# ====== AI RECS FAILURE IN AUDIT ======

class TestAIRecsFailure:
    def test_audit_ai_recs_failure(self, client):
        """Cover lines 419-421: AI recommendations failure in run_audit."""
        headers = _auth_headers(client)
        with patch("server.analyze_url", new_callable=AsyncMock) as mock_analyze, \
             patch("server.ai_service.audit_recommendations", new_callable=AsyncMock) as mock_ai:
            mock_analyze.return_value = {
                "url": "https://example.com", "overall_score": 68,
                "categories": {}, "issues": [], "fetch_failed": False,
            }
            mock_ai.side_effect = Exception("AI timeout")
            resp = client.post("/api/audits", json={
                "url": "https://example.com",
            }, headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert "ai_recommendations" in data
            assert "temporarily unavailable" in str(data["ai_recommendations"])


# ====== STRIPE CUSTOMER ID FAILURE ======

class TestStripeCustomerIdFailure:
    def test_billing_status_customer_id_failure(self, client):
        """Cover lines 693-694: Stripe customer_id retrieval failure."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].payment_transactions.insert_one({
            "id": "tx-custfail", "user_id": "admin-1", "user_email": "admin@searchgoodly.com",
            "session_id": "cs_custfail", "plan_id": "concierge", "amount": 1000,
            "currency": "usd", "payment_status": "initiated", "status": "open",
            "applied": False, "metadata": {}, "created_at": "2026-01-01T00:00:00",
        })
        # First retrieve succeeds (paid), second retrieve fails
        call_count = [0]
        def side_effect(session_id):
            call_count[0] += 1
            if call_count[0] == 1:
                return {"status": "complete", "payment_status": "paid",
                        "amount_total": 10000, "currency": "usd", "customer": "cus_123"}
            else:
                raise Exception("Stripe API error")

        with patch("server.stripe_sdk.checkout.Session.retrieve", side_effect=side_effect):
            resp = client.get("/api/billing/status/cs_custfail", headers=headers)
            assert resp.status_code == 200
            assert resp.json()["payment_status"] == "paid"


# ====== PORTAL CUSTOMER FROM TX ======

class TestPortalCustomerFromTx:
    def test_portal_customer_from_transaction(self, client):
        """Cover lines 729-730: portal gets customer_id from transaction."""
        import server as srv
        headers = _auth_headers(client)
        # Remove stripe_customer_id from user, add it to a transaction
        srv._client["goodly_test"].users.update_one(
            {"id": "admin-1"}, {"$unset": {"stripe_customer_id": ""}}
        )
        srv._client["goodly_test"].payment_transactions.insert_one({
            "id": "tx-portal", "user_id": "admin-1", "user_email": "admin@searchgoodly.com",
            "session_id": "cs_portal", "plan_id": "concierge", "amount": 1000,
            "currency": "usd", "payment_status": "paid", "status": "complete",
            "applied": True, "stripe_customer_id": "cus_from_tx",
            "metadata": {}, "created_at": "2026-01-01T00:00:00",
        })
        with patch("server.stripe_sdk.billing_portal.Session.create") as mock_portal:
            mock_session = MagicMock()
            mock_session.url = "https://billing.stripe.com/session/xyz"
            mock_portal.return_value = mock_session
            resp = client.post("/api/billing/portal", json={
                "return_url": "http://localhost:3000/dashboard",
            }, headers=headers)
            assert resp.status_code == 200
            assert "url" in resp.json()


# ====== WEBHOOK SECRET NOT CONFIGURED ======

class TestWebhookNoSecret:
    def test_webhook_no_secret(self, monkeypatch):
        """Cover lines 757-758: webhook secret not configured."""
        monkeypatch.delenv("STRIPE_WEBHOOK_SECRET", raising=False)
        import server as srv
        from fastapi.testclient import TestClient
        # Need fresh client with no webhook secret
        client = TestClient(srv.app)
        resp = client.post("/api/webhook/stripe", content=b'{"type":"test"}')
        assert resp.status_code == 400


# ====== SERP HISTORY WITH PROJECT ======

class TestSerpHistoryProject:
    def test_serp_history_with_project_id(self, client):
        """Cover line 847: SERP history with project_id filter."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].serp_checks.insert_one({
            "id": "serp-proj-1", "user_id": "admin-1", "project_id": "proj-x",
            "keyword": "test", "domain": "example.com",
            "rank": 5, "results": [],
            "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/serp/history?project_id=proj-x", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1


# ====== PDF NOT OWNER ======

class TestPdfNotOwner:
    def test_pdf_not_owner(self, client):
        """Cover line 865: PDF export not owner."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].audits.insert_one({
            "id": "pdf-other", "user_id": "other-user",
            "project_id": "proj-other", "url": "https://example.com",
            "overall_score": 50, "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/audits/pdf-other/pdf", headers=headers)
        assert resp.status_code == 404


# ====== SCHEDULER START IN LIFESPAN ======

class TestSchedulerStart:
    def test_lifespan_starts_scheduler(self, monkeypatch):
        """Cover line 1401: scheduler start in lifespan."""
        monkeypatch.setenv("MONGO_URL", "mongodb://localhost:27017")
        monkeypatch.setenv("JWT_SECRET", "test-secret-32-bytes-long-key!!")
        monkeypatch.setenv("GEMINI_API_KEY", "test-key")
        monkeypatch.setenv("STRIPE_API_KEY", "test-stripe-key")
        monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "test-wh-secret")
        monkeypatch.setenv("ADMIN_PASSWORD", "admin123")
        monkeypatch.setenv("SCHEDULER_ENABLED", "true")

        import server as srv
        from server import lifespan
        import asyncio

        async def run():
            with patch("server.scheduler_mod.start") as mock_start:
                async with lifespan(srv.app):
                    pass
                mock_start.assert_called_once()

        asyncio.run(run())
