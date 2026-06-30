"""Final targeted tests for server.py 93%→95%+."""
import os, sys, pytest, json, uuid
from unittest.mock import patch, MagicMock, AsyncMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


def _auth_headers(client):
    resp = client.post("/api/auth/login", json={
        "email": "admin@goodly.app", "password": "admin-secret-123",
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['token']}"}


# ====== PASSWORD VALIDATOR ======

class TestPasswordValidator:
    def test_common_password_rejected(self, client):
        """Cover line 134: common password validation."""
        resp = client.post("/api/auth/register", json={
            "email": f"common-{uuid.uuid4().hex[:8]}@test.com",
            "password": "password", "name": "Test",
        })
        assert resp.status_code == 422


# ====== PROJECT LIMIT ======

class TestProjectLimit:
    def test_project_limit_reached(self, client):
        """Cover line 336: project limit reached."""
        import server as srv
        # Register a free user (limit: 1 project)
        email = f"limit-{uuid.uuid4().hex[:8]}@test.com"
        resp = client.post("/api/auth/register", json={
            "email": email, "password": "Test1234!", "name": "Limit User",
        })
        assert resp.status_code == 200
        token = resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Create first project (should succeed)
        resp = client.post("/api/projects", json={
            "name": "First Project", "url": "https://first.com",
        }, headers=headers)
        assert resp.status_code == 200

        # Create second project (should fail — free plan limit is 1)
        resp = client.post("/api/projects", json={
            "name": "Second Project", "url": "https://second.com",
        }, headers=headers)
        assert resp.status_code == 402


# ====== AUDIT LIMIT ======

class TestAuditLimit:
    def test_audit_limit_reached(self, client):
        """Cover lines 405-407: audit limit reached."""
        import server as srv
        email = f"auditlimit-{uuid.uuid4().hex[:8]}@test.com"
        resp = client.post("/api/auth/register", json={
            "email": email, "password": "Test1234!", "name": "Audit Limit",
        })
        assert resp.status_code == 200
        token = resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Free plan has audit_limit=3. Run 3 audits first.
        with patch("server.analyze_url", new_callable=AsyncMock) as mock_analyze, \
             patch("server.ai_service.audit_recommendations", new_callable=AsyncMock) as mock_ai:
            mock_analyze.return_value = {
                "url": "https://example.com", "overall_score": 68,
                "categories": {}, "issues": [], "fetch_failed": False,
            }
            mock_ai.return_value = {
                "summary": "Good", "priority_actions": [], "wins": [], "next_30_days": [],
            }
            for i in range(3):
                resp = client.post("/api/audits", json={
                    "url": f"https://example{i}.com",
                }, headers=headers)
                assert resp.status_code == 200

            # 4th audit should fail
            resp = client.post("/api/audits", json={
                "url": "https://example4.com",
            }, headers=headers)
            assert resp.status_code == 402


# ====== HEALTH CHECK DB ERROR ======

class TestHealthCheck:
    def test_health_db_error(self, client):
        """Cover lines 563-565: health check DB error."""
        import server as srv
        with patch.object(srv.db, "command") as mock_cmd:
            mock_cmd.side_effect = Exception("DB down")
            resp = client.get("/api/health")
            assert resp.status_code == 200
            data = resp.json()
            assert "disconnected" in data.get("database", "")


# ====== SUMMARY WITH DATA ======

class TestSummary:
    def test_summary_with_audits(self, client):
        """Cover line 588: summary with recent audits."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].audits.insert_one({
            "id": "sum-audit-1", "user_id": "admin-1",
            "url": "https://example.com", "overall_score": 85,
            "result": {"overall_score": 85, "categories": {}, "issues": []},
            "created_at": "2026-06-01T00:00:00", "month_key": "2026-06",
        })
        resp = client.get("/api/dashboard/summary", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "recent_audits" in data


# ====== WEBHOOK PAYMENT APPLIED ======

class TestWebhookApplied:
    def test_webhook_payment_applied(self, client):
        """Cover lines 775-779: webhook payment applied."""
        import server as srv
        srv._client["goodly_test"].payment_transactions.insert_one({
            "id": "tx-wh-1", "user_id": "admin-1", "user_email": "admin@goodly.app",
            "session_id": "cs_wh_paid", "plan_id": "concierge", "amount": 1000,
            "currency": "usd", "payment_status": "initiated", "status": "open",
            "applied": False, "metadata": {}, "created_at": "2026-01-01T00:00:00",
        })
        with patch("server.stripe_sdk.Webhook.construct_event") as mock_construct:
            mock_construct.return_value = {
                "type": "checkout.session.completed",
                "data": {"object": {
                    "id": "cs_wh_paid", "customer": "cus_wh_new",
                    "payment_status": "paid",
                }},
            }
            resp = client.post("/api/webhook/stripe",
                content=b'{"type":"checkout.session.completed"}',
                headers={"stripe-signature": "valid_sig"},
            )
            assert resp.status_code == 200


# ====== LIFESPAN EDGE CASES ======

class TestLifespanEdges:
    def test_lifespan_ttl_index_error(self, monkeypatch):
        """Cover lines 1362-1363: TTL index creation error."""
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
            # Patch create_index to fail for TTL indexes
            original = srv._client["goodly_test"].serp_checks.create_index
            call_count = [0]
            async def failing_create_index(*a, **kw):
                call_count[0] += 1
                if call_count[0] >= 2:  # Second create_index call (TTL)
                    raise Exception("TTL not supported")
                return await original(*a, **kw)

            with patch.object(srv._client["goodly_test"].serp_checks, "create_index",
                              side_effect=failing_create_index):
                async with lifespan(srv.app):
                    pass

        asyncio.run(run())

    @pytest.mark.skip(reason="ADMIN_PASSWORD set by conftest.setdefault, lifespan doesn't regenerate")
    def test_lifespan_admin_password_generated(self):
        """Cover lines 1371-1372: admin password auto-generation."""
        import server as srv
        from server import lifespan
        import asyncio
        import os as _os

        # Save and remove ADMIN_PASSWORD to trigger auto-generation
        saved = _os.environ.pop("ADMIN_PASSWORD", None)
        _os.environ["MONGO_URL"] = "mongodb://localhost:27017"
        _os.environ["JWT_SECRET"] = "test-secret-32-bytes-long-key!!"
        _os.environ["GEMINI_API_KEY"] = "test-key"
        _os.environ["STRIPE_API_KEY"] = "test-stripe-key"
        _os.environ["STRIPE_WEBHOOK_SECRET"] = "test-wh-secret"
        _os.environ["SCHEDULER_ENABLED"] = "false"

        captured_password = []

        async def run():
            async with lifespan(srv.app):
                captured_password.append(_os.environ.get("ADMIN_PASSWORD"))

        try:
            asyncio.run(run())
            assert captured_password[0] is not None
        finally:
            if saved:
                _os.environ["ADMIN_PASSWORD"] = saved

    def test_lifespan_shutdown_exception(self, monkeypatch):
        """Cover lines 1410-1411: shutdown exception handler."""
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
            with patch("server.scheduler_mod.shutdown") as mock_shutdown:
                mock_shutdown.side_effect = Exception("shutdown failed")
                async with lifespan(srv.app):
                    pass
                # Should not raise — exception is caught

        asyncio.run(run())
