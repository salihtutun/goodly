"""Targeted tests for remaining server.py coverage gaps (89%→92%+)."""
import os, sys, pytest, json, uuid
from unittest.mock import patch, MagicMock, AsyncMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


def _auth_headers(client):
    resp = client.post("/api/auth/login", json={
        "email": "admin@searchgoodly.com", "password": "admin-secret-123",
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['token']}"}


# ====== AUTH: get_user not found, me not found ======

class TestAuthEdgeCases:
    def test_get_user_not_found(self):
        """Cover line 105: get_user not found."""
        import server as srv
        import asyncio
        async def run():
            with pytest.raises(Exception) as exc:
                await srv.get_user("nonexistent-user-id")
            assert exc.value.status_code == 401
        asyncio.run(run())

    def test_me_user_not_found(self, client):
        """Cover line 229: me endpoint user not found."""
        import server as srv
        srv._client["goodly_test"].users.insert_one({
            "id": "ghost-user", "email": "ghost@test.com",
            "password_hash": "hash", "name": "Ghost",
            "role": "user", "plan": "free", "onboarded": False,
            "email_verified": False, "created_at": "2026-01-01T00:00:00",
        })
        from auth import create_access_token
        token = create_access_token("ghost-user", "ghost@test.com")
        srv._client["goodly_test"].users.delete_one({"id": "ghost-user"})
        resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
        assert resp.status_code == 401


# ====== AUDITS: list with project_id, get not found, delete not found ======

class TestAuditEdgeCases:
    def test_list_audits_with_project_id(self, client):
        """Cover line 449: list audits with project_id filter."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].projects.insert_one({
            "id": "ap1", "user_id": "admin-1",
            "url": "https://example.com", "name": "P1",
            "created_at": "2026-01-01T00:00:00",
        })
        srv._client["goodly_test"].audits.insert_one({
            "id": "a1", "user_id": "admin-1", "project_id": "ap1",
            "url": "https://example.com", "overall_score": 80,
            "result": {"overall_score": 80, "categories": {}, "issues": []},
            "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/audits?project_id=ap1", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1

    def test_get_audit_not_found(self, client):
        """Cover line 471: get audit not found."""
        headers = _auth_headers(client)
        resp = client.get("/api/audits/nonexistent", headers=headers)
        assert resp.status_code == 404

    def test_delete_audit_not_found(self, client):
        """Cover line 479: delete audit not found."""
        headers = _auth_headers(client)
        resp = client.delete("/api/audits/nonexistent", headers=headers)
        assert resp.status_code == 404


# ====== AI ENDPOINTS: error paths ======

class TestAIErrorPaths:
    def test_meta_tags_error(self, client):
        """Cover lines 513-515: meta tags error."""
        headers = _auth_headers(client)
        with patch("server.ai_service.generate_meta_tags") as mock_ai:
            mock_ai.side_effect = Exception("AI down")
            resp = client.post("/api/ai/meta-tags", json={
                "business_name": "Test", "description": "Test",
            }, headers=headers)
            assert resp.status_code == 502

    def test_keywords_error(self, client):
        """Cover lines 528-530: keywords error."""
        headers = _auth_headers(client)
        with patch("server.ai_service.keyword_research") as mock_ai:
            mock_ai.side_effect = Exception("AI down")
            resp = client.post("/api/ai/keywords", json={
                "seed_topic": "test",
            }, headers=headers)
            assert resp.status_code == 502

    def test_competitors_error(self, client):
        """Cover lines 544-546: competitors error."""
        headers = _auth_headers(client)
        with patch("server.ai_service.competitor_analysis") as mock_ai:
            mock_ai.side_effect = Exception("AI down")
            resp = client.post("/api/ai/competitors", json={
                "your_site": "https://example.com",
                "competitors": ["https://other.com"],
            }, headers=headers)
            assert resp.status_code == 502


# ====== GBP: error paths ======

class TestGbpErrorPaths:
    def test_gbp_audit_error(self, client):
        """Cover lines 933-935: GBP audit error."""
        headers = _auth_headers(client)
        with patch("server.gbp_service.audit_listing") as mock_gbp:
            mock_gbp.side_effect = Exception("GBP down")
            resp = client.post("/api/gbp/audit", json={
                "business_name": "Test", "primary_category": "Test",
            }, headers=headers)
            assert resp.status_code == 502

    def test_gbp_suggestions_error(self, client):
        """Cover lines 953-955: GBP suggestions error."""
        headers = _auth_headers(client)
        with patch("server.gbp_service.suggestions") as mock_gbp:
            mock_gbp.side_effect = Exception("GBP down")
            resp = client.post("/api/gbp/suggestions", json={
                "business_name": "Test", "primary_category": "Test",
            }, headers=headers)
            assert resp.status_code == 502

    def test_gbp_competitors_error(self, client):
        """Cover lines 967-969: GBP competitors error."""
        headers = _auth_headers(client)
        with patch("server.gbp_service.compare_competitors") as mock_gbp:
            mock_gbp.side_effect = Exception("GBP down")
            resp = client.post("/api/gbp/competitors", json={
                "business_name": "Test", "primary_category": "Test",
                "competitors": ["Comp1"],
            }, headers=headers)
            assert resp.status_code == 502


# ====== SOCIAL: error paths ======

class TestSocialErrorPaths:
    def test_social_audit_error(self, client):
        """Cover lines 1141-1143: social audit error."""
        headers = _auth_headers(client)
        with patch("server.social_fetcher.fetch_profile_signals") as mock_fetch, \
             patch("server.social_service.audit_profile") as mock_soc:
            mock_fetch.return_value = {}
            mock_soc.side_effect = Exception("Social down")
            resp = client.post("/api/social/audit", json={
                "platform": "instagram", "handle": "testuser",
            }, headers=headers)
            assert resp.status_code == 502

    def test_social_suggestions_error(self, client):
        """Cover lines 1173-1175: social suggestions error."""
        headers = _auth_headers(client)
        with patch("server.social_service.suggestions") as mock_soc:
            mock_soc.side_effect = Exception("Social down")
            resp = client.post("/api/social/suggestions", json={
                "platform": "instagram", "handle": "testuser",
            }, headers=headers)
            assert resp.status_code == 502

    def test_social_competitors_error(self, client):
        """Cover lines 1193-1195: social competitors error."""
        headers = _auth_headers(client)
        with patch("server.social_service.compare_competitors") as mock_soc:
            mock_soc.side_effect = Exception("Social down")
            resp = client.post("/api/social/competitors", json={
                "platform": "instagram", "your_handle": "testuser",
                "competitors": ["comp1"],
            }, headers=headers)
            assert resp.status_code == 502

    def test_social_history(self, client):
        """Cover line 1203: social history."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].social_audits.insert_one({
            "id": "soc-1", "user_id": "admin-1",
            "input": {}, "result": {},
            "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/social/audits", headers=headers)
        assert resp.status_code == 200


# ====== CONCIERGE ======

class TestConcierge:
    def test_concierge_brief_create(self, client):
        """Cover lines 1247-1250: concierge brief create."""
        headers = _auth_headers(client)
        resp = client.post("/api/concierge/brief", json={
            "business_name": "Test Biz",
            "website": "https://example.com",
            "primary_goal": "Rank #1",
            "target_keywords": ["test"],
            "competitors": ["none"],
        }, headers=headers)
        assert resp.status_code == 200

    def test_concierge_brief_get(self, client):
        """Cover line 1265: concierge brief get."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].concierge_briefs.insert_one({
            "user_id": "admin-1",
            "business_name": "Test", "website": "https://example.com",
            "primary_goal": "Rank", "target_keywords": ["test"],
            "competitors": ["none"], "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/concierge/brief", headers=headers)
        assert resp.status_code == 200

    def test_admin_concierge_briefs(self, client):
        """Cover line 1300: admin concierge briefs."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].concierge_briefs.insert_one({
            "user_id": "admin-1",
            "business_name": "Test", "website": "https://example.com",
            "primary_goal": "Rank", "target_keywords": ["test"],
            "competitors": ["none"], "created_at": "2026-01-01T00:00:00",
        })
        resp = client.get("/api/admin/concierge/briefs", headers=headers)
        assert resp.status_code == 200


# ====== SCHEDULE: run-now ======

class TestScheduleRunNow:
    def test_schedule_run_now(self, client):
        """Cover line 1072-1073: schedule run-now."""
        import server as srv
        headers = _auth_headers(client)
        srv._client["goodly_test"].projects.insert_one({
            "id": "run-now-proj", "user_id": "admin-1",
            "url": "https://example.com", "name": "RunNow",
            "schedule": "monthly", "next_audit_at": "2026-07-01T00:00:00",
            "created_at": "2026-01-01T00:00:00",
        })
        with patch("server.scheduler_mod.run_due_audits") as mock_run:
            mock_run.return_value = {"audited": 1}
            resp = client.post("/api/scheduler/run-now", headers=headers)
            assert resp.status_code == 200
