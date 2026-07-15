"""Final push: server.py 97%→98%+ — last 26 missed lines."""
import os, sys, pytest, json, uuid
from unittest.mock import patch, MagicMock, AsyncMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
import server as srv


def _auth_headers(client):
    resp = client.post("/api/auth/login", json={
        "email": "admin@searchgoodly.com", "password": "admin-secret-123",
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['token']}"}


# ====== LIST AUDITS WITH TRIMMING ======

class TestListAuditsTrimming:
    def test_list_audits_trims_result(self, client):
        """Cover lines 454-455: list_audits trims result and ai_recommendations."""
        headers = _auth_headers(client)
        srv._client["goodly_test"].audits.insert_one({
            "id": "trim-1", "user_id": "admin-1",
            "url": "https://example.com", "overall_score": 80,
            "result": {"overall_score": 80, "categories": {"seo": 70}, "url": "https://example.com", "issues": [{"msg": "test"}]},
            "ai_recommendations": {"summary": "test"},
            "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/audits", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        # Result should be trimmed to summary
        assert "summary" in data[0]
        assert "result" not in data[0]
        assert "ai_recommendations" not in data[0]


# ====== CONCIERGE BRIEF ======

class TestConciergeBrief:
    def test_concierge_brief_upsert(self, client):
        """Cover line 1223: concierge brief upsert."""
        headers = _auth_headers(client)
        resp = client.post("/api/concierge/brief", json={
            "business_name": "Test Biz",
            "website": "https://example.com",
            "primary_goal": "Rank #1",
            "target_keywords": ["test"],
            "competitors": ["comp1"],
        }, headers=headers)
        assert resp.status_code == 200
        assert "id" in resp.json()

    def test_concierge_brief_get(self, client):
        """Cover lines 1267-1270: concierge brief get."""
        headers = _auth_headers(client)
        srv._client["goodly_test"].concierge_briefs.insert_one({
            "user_id": "admin-1",
            "business_name": "Test", "website": "https://example.com",
            "primary_goal": "Rank", "target_keywords": ["test"],
            "competitors": ["comp1"], "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/concierge/brief", headers=headers)
        assert resp.status_code == 200
        assert resp.json().get("business_name") == "Test"

    def test_admin_concierge_briefs(self, client):
        """Cover line 1285: admin concierge briefs list."""
        headers = _auth_headers(client)
        srv._client["goodly_test"].concierge_briefs.insert_one({
            "user_id": "admin-1",
            "business_name": "AdminBiz", "website": "https://admin.com",
            "primary_goal": "Rank", "target_keywords": ["test"],
            "competitors": ["comp1"], "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/admin/concierge/briefs", headers=headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1


# ====== REFERRAL INVITE ======

class TestReferralInvite:
    def test_referral_invite(self, client):
        """Cover lines 1301-1313: referral invite endpoint."""
        headers = _auth_headers(client)
        with patch("server.email_service.send_html_email") as mock_send:
            mock_send.return_value = {"mocked": True, "id": None, "error": None}
            resp = client.post("/api/referrals/invite", json={
                "email": "friend@test.com",
            }, headers=headers)
            assert resp.status_code == 200
            assert resp.json()["ok"] is True
            mock_send.assert_called_once()

    def test_referral_invite_email_failure(self, client):
        """Cover referral invite email failure path."""
        headers = _auth_headers(client)
        with patch("server.email_service.send_html_email") as mock_send:
            mock_send.side_effect = Exception("Email down")
            resp = client.post("/api/referrals/invite", json={
                "email": "friend@test.com",
            }, headers=headers)
            assert resp.status_code == 200
            assert resp.json()["ok"] is True


# ====== LIFESPAN INDEX CREATION ======

class TestLifespanIndexes:
    def test_lifespan_creates_indexes(self, monkeypatch):
        """Cover line 1346: lifespan creates audit indexes."""
        monkeypatch.setenv("MONGO_URL", "mongodb://localhost:27017")
        monkeypatch.setenv("JWT_SECRET", "test-secret-32-bytes-long-key!!")
        monkeypatch.setenv("GEMINI_API_KEY", "test-key")
        monkeypatch.setenv("STRIPE_API_KEY", "test-stripe-key")
        monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "test-wh-secret")
        monkeypatch.setenv("ADMIN_PASSWORD", "admin123")
        monkeypatch.setenv("SCHEDULER_ENABLED", "false")

        from server import lifespan
        import asyncio

        async def run():
            async with lifespan(srv.app):
                pass

        asyncio.run(run())


# ====== LIFESPAN SHUTDOWN ======

class TestLifespanShutdown:
    def test_lifespan_shutdown(self, monkeypatch):
        """Cover lines 1417-1418: lifespan shutdown."""
        monkeypatch.setenv("MONGO_URL", "mongodb://localhost:27017")
        monkeypatch.setenv("JWT_SECRET", "test-secret-32-bytes-long-key!!")
        monkeypatch.setenv("GEMINI_API_KEY", "test-key")
        monkeypatch.setenv("STRIPE_API_KEY", "test-stripe-key")
        monkeypatch.setenv("STRIPE_WEBHOOK_SECRET", "test-wh-secret")
        monkeypatch.setenv("ADMIN_PASSWORD", "admin123")
        monkeypatch.setenv("SCHEDULER_ENABLED", "false")

        from server import lifespan
        import asyncio

        async def run():
            with patch("server.scheduler_mod.shutdown") as mock_shutdown:
                async with lifespan(srv.app):
                    pass
                mock_shutdown.assert_called_once()

        asyncio.run(run())
