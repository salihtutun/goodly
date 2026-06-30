"""Final push: server.py 97%→99% — last 25 missed lines."""
import os, sys, pytest, json, uuid
from unittest.mock import patch, MagicMock, AsyncMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))
import server as srv


def _auth_headers(client):
    resp = client.post("/api/auth/login", json={
        "email": "admin@goodly.app", "password": "admin-secret-123",
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['token']}"}


# ====== AUDIT GET/DELETE SUCCESS ======

class TestAuditSuccess:
    def test_get_audit_success(self, client):
        """Cover line 471: get_audit success return."""
        headers = _auth_headers(client)
        srv._client["goodly_test"].audits.insert_one({
            "id": "audit-get-1", "user_id": "admin-1",
            "url": "https://example.com", "overall_score": 80,
            "result": {"overall_score": 80}, "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/audits/audit-get-1", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == "audit-get-1"

    def test_delete_audit_success(self, client):
        """Cover line 479: delete_audit success return."""
        headers = _auth_headers(client)
        srv._client["goodly_test"].audits.insert_one({
            "id": "audit-del-1", "user_id": "admin-1",
            "url": "https://example.com", "overall_score": 80,
            "result": {"overall_score": 80}, "created_at": "2026-01-01T00:00:00",
        })
        resp = client.delete("/api/audits/audit-del-1", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["ok"] is True


# ====== SCHEDULE PERMISSION DENIED ======

class TestSchedulePermission:
    def test_schedule_permission_denied(self, client):
        """Cover line 865: schedule denied for free user."""
        email = f"schedfree-{uuid.uuid4().hex[:8]}@test.com"
        resp = client.post("/api/auth/register", json={
            "email": email, "password": "Test1234!", "name": "Free User",
        })
        token = resp.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        resp = client.post("/api/projects", json={
            "name": "SchedProj", "url": "https://example.com",
        }, headers=headers)
        proj_id = resp.json()["id"]
        resp = client.post(f"/api/projects/{proj_id}/schedule", json={
            "schedule": "monthly",
        }, headers=headers)
        assert resp.status_code == 402


# ====== VISIBILITY SCORE CALCULATION ======

class TestVisibilityScore:
    def test_visibility_score_with_data(self, client):
        """Cover lines 1072-1073: visibility score with data."""
        headers = _auth_headers(client)
        srv._client["goodly_test"].audits.insert_one({
            "id": "vis-audit", "user_id": "admin-1",
            "url": "https://example.com", "overall_score": 80,
            "result": {"overall_score": 80}, "created_at": "2026-01-01T00:00:00",
        })
        srv._client["goodly_test"].social_audits.insert_one({
            "id": "vis-soc", "user_id": "admin-1",
            "input": {}, "result": {}, "created_at": "2026-01-01T00:00:00",
        })
        srv._client["goodly_test"].ai_visibility_checks.insert_one({
            "id": "vis-ai", "user_id": "admin-1",
            "input": {}, "result": {}, "created_at": "2026-01-01T00:00:00",
        })
        srv._client["goodly_test"].gbp_audits.insert_one({
            "id": "vis-gbp", "user_id": "admin-1",
            "input": {}, "result": {}, "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/dashboard/visibility", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "overall_score" in data
        assert "breakdown" in data


# ====== SOCIAL HISTORY ======

class TestSocialHistory:
    def test_social_history_with_data(self, client):
        """Cover line 1203: social history return."""
        headers = _auth_headers(client)
        srv._client["goodly_test"].social_audits.insert_one({
            "id": "soc-hist-1", "user_id": "admin-1",
            "input": {}, "result": {"score": 70},
            "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/social/audits", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1


# ====== CONCIERGE BRIEF ======

class TestConciergeBrief:
    def test_concierge_brief_upsert(self, client):
        """Cover lines 1247-1250: concierge brief upsert."""
        headers = _auth_headers(client)
        resp = client.post("/api/concierge/brief", json={
            "business_name": "Test Biz",
            "website": "https://example.com",
            "primary_goal": "Rank #1",
            "target_keywords": ["test"],
            "competitors": ["comp1"],
        }, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data

    def test_concierge_brief_get(self, client):
        """Cover line 1265: concierge brief get."""
        headers = _auth_headers(client)
        srv._client["goodly_test"].concierge_briefs.insert_one({
            "user_id": "admin-1",
            "business_name": "Test", "website": "https://example.com",
            "primary_goal": "Rank", "target_keywords": ["test"],
            "competitors": ["comp1"], "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/concierge/brief", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("business_name") == "Test"

    def test_admin_concierge_briefs(self, client):
        """Cover line 1300: admin concierge briefs list."""
        headers = _auth_headers(client)
        srv._client["goodly_test"].concierge_briefs.insert_one({
            "user_id": "admin-1",
            "business_name": "AdminBiz", "website": "https://admin.com",
            "primary_goal": "Rank", "target_keywords": ["test"],
            "competitors": ["comp1"], "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/admin/concierge/briefs", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1


# ====== LIFESPAN TTL INDEX ERROR ======

class TestLifespanTTL:
    def test_lifespan_ttl_index_error(self, monkeypatch):
        """Cover lines 1362-1363: TTL index creation error."""
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
            raw_coll = srv._client["goodly_test"].serp_checks
            original = raw_coll.create_index
            call_count = [0]

            def failing_create_index(*a, **kw):
                call_count[0] += 1
                if call_count[0] >= 2:
                    raise Exception("TTL not supported")
                return original(*a, **kw)

            raw_coll.create_index = failing_create_index
            try:
                async with lifespan(srv.app):
                    pass
            finally:
                raw_coll.create_index = original

        asyncio.run(run())
