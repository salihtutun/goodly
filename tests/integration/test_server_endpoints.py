"""Comprehensive endpoint tests for server.py — all 53 routes.

Uses conftest.py mongomock + TestClient setup with rate limiting disabled.
"""
import os, sys, pytest, json, uuid
from unittest.mock import patch, MagicMock, AsyncMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


# ---- helpers (duplicated from conftest to avoid import issues) ----
def _auth_headers(client):
    """Login as admin and return Authorization header dict."""
    resp = client.post("/api/auth/login", json={
        "email": "admin@goodly.app", "password": "admin-secret-123",
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return {"Authorization": f"Bearer {resp.json()['token']}"}


def _register_and_login(client, email=None):
    """Register a new user and return (headers, user_dict)."""
    if email is None:
        email = f"test-{uuid.uuid4().hex[:8]}@example.com"
    resp = client.post("/api/auth/register", json={
        "email": email, "password": "TestPass123!", "name": "Test User",
    })
    assert resp.status_code == 200, f"Register failed: {resp.text}"
    data = resp.json()
    return {"Authorization": f"Bearer {data['token']}"}, data["user"]


# ====== AUTH ENDPOINTS ======

class TestAuth:
    def test_register_success(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "newuser@test.com", "password": "TestPass123!", "name": "New User",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["email"] == "newuser@test.com"

    def test_register_duplicate(self, client):
        client.post("/api/auth/register", json={
            "email": "dup@test.com", "password": "TestPass123!",
        })
        resp = client.post("/api/auth/register", json={
            "email": "dup@test.com", "password": "TestPass123!",
        })
        assert resp.status_code == 400

    def test_register_weak_password(self, client):
        resp = client.post("/api/auth/register", json={
            "email": "weak@test.com", "password": "short",
        })
        assert resp.status_code == 422

    def test_login_success(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "admin@goodly.app", "password": "admin-secret-123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "token" in data
        assert data["user"]["email"] == "admin@goodly.app"

    def test_login_wrong_password(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "admin@goodly.app", "password": "wrong-password",
        })
        assert resp.status_code == 401

    def test_login_nonexistent(self, client):
        resp = client.post("/api/auth/login", json={
            "email": "nobody@test.com", "password": "whatever123",
        })
        assert resp.status_code == 401

    def test_logout(self, client):
        resp = client.post("/api/auth/logout")
        assert resp.status_code == 200
        assert resp.json()["ok"] == True

    def test_me_authenticated(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/auth/me", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["email"] == "admin@goodly.app"

    def test_me_unauthenticated(self, client):
        resp = client.get("/api/auth/me")
        assert resp.status_code == 401

    def test_verify_email_invalid(self, client):
        resp = client.get("/api/auth/verify/fake-token")
        assert resp.status_code == 404

    def test_forgot_password(self, client):
        resp = client.post("/api/auth/forgot-password", json={
            "email": "admin@goodly.app",
        })
        assert resp.status_code == 200
        assert resp.json()["ok"] == True

    def test_forgot_password_nonexistent(self, client):
        resp = client.post("/api/auth/forgot-password", json={
            "email": "nobody@test.com",
        })
        assert resp.status_code == 200
        assert resp.json()["ok"] == True

    def test_reset_password_invalid(self, client):
        resp = client.post("/api/auth/reset-password", json={
            "token": "fake-token", "new_password": "NewPass123!",
        })
        assert resp.status_code == 400

    def test_onboarded(self, client):
        headers = _auth_headers(client)
        resp = client.post("/api/auth/onboarded", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["ok"] == True


# ====== PROJECT ENDPOINTS ======

class TestProjects:
    def test_create_project(self, client):
        headers = _auth_headers(client)
        resp = client.post("/api/projects", json={
            "name": "My Site", "url": "https://example.com",
            "description": "A test site",
        }, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "My Site"

    def test_create_project_minimal(self, client):
        headers = _auth_headers(client)
        resp = client.post("/api/projects", json={
            "name": "Minimal", "url": "https://minimal.com",
        }, headers=headers)
        assert resp.status_code == 200

    def test_list_projects(self, client):
        headers = _auth_headers(client)
        client.post("/api/projects", json={
            "name": "P1", "url": "https://p1.com",
        }, headers=headers)
        resp = client.get("/api/projects", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_project(self, client):
        headers = _auth_headers(client)
        created = client.post("/api/projects", json={
            "name": "GetMe", "url": "https://getme.com",
        }, headers=headers).json()
        resp = client.get(f"/api/projects/{created['id']}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "GetMe"

    def test_get_project_not_found(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/projects/fake-id", headers=headers)
        assert resp.status_code == 404

    def test_update_project(self, client):
        headers = _auth_headers(client)
        created = client.post("/api/projects", json={
            "name": "Old", "url": "https://old.com",
        }, headers=headers).json()
        resp = client.patch(f"/api/projects/{created['id']}", json={
            "name": "New Name",
        }, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Name"

    def test_update_project_no_fields(self, client):
        headers = _auth_headers(client)
        created = client.post("/api/projects", json={
            "name": "X", "url": "https://x.com",
        }, headers=headers).json()
        resp = client.patch(f"/api/projects/{created['id']}", json={}, headers=headers)
        assert resp.status_code == 400

    def test_delete_project(self, client):
        headers = _auth_headers(client)
        created = client.post("/api/projects", json={
            "name": "DelMe", "url": "https://delme.com",
        }, headers=headers).json()
        resp = client.delete(f"/api/projects/{created['id']}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["ok"] == True

    def test_delete_project_not_found(self, client):
        headers = _auth_headers(client)
        resp = client.delete("/api/projects/fake-id", headers=headers)
        assert resp.status_code == 404


# ====== AUDIT ENDPOINTS ======

class TestAudits:
    def test_run_audit(self, client):
        headers = _auth_headers(client)
        with patch("server.analyze_url", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = {
                "url": "https://example.com", "overall_score": 68,
                "categories": {}, "issues": [], "fetch_failed": False,
            }
            with patch("server.ai_service.audit_recommendations", new_callable=AsyncMock) as mock_ai:
                mock_ai.return_value = {
                    "summary": "Good site", "priority_actions": [],
                    "wins": [], "next_30_days": [],
                }
                resp = client.post("/api/audits", json={
                    "url": "https://example.com",
                }, headers=headers)
                assert resp.status_code == 200
                data = resp.json()
                assert "id" in data
                assert data["result"]["overall_score"] == 68

    def test_run_audit_with_project(self, client):
        headers = _auth_headers(client)
        proj = client.post("/api/projects", json={
            "name": "AuditProj", "url": "https://auditproj.com",
        }, headers=headers).json()
        with patch("server.analyze_url", new_callable=AsyncMock) as mock_analyze:
            mock_analyze.return_value = {
                "url": "https://auditproj.com", "overall_score": 75,
                "categories": {}, "issues": [], "fetch_failed": False,
            }
            with patch("server.ai_service.audit_recommendations", new_callable=AsyncMock) as mock_ai:
                mock_ai.return_value = {
                    "summary": "OK", "priority_actions": [], "wins": [], "next_30_days": [],
                }
                resp = client.post("/api/audits", json={
                    "url": "https://auditproj.com", "project_id": proj["id"],
                }, headers=headers)
                assert resp.status_code == 200

    def test_list_audits(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/audits", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_get_audit_not_found(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/audits/fake-id", headers=headers)
        assert resp.status_code == 404

    def test_delete_audit_not_found(self, client):
        headers = _auth_headers(client)
        resp = client.delete("/api/audits/fake-id", headers=headers)
        assert resp.status_code == 404


# ====== AI TOOLS ======

class TestAITools:
    def test_meta_tags(self, client):
        headers = _auth_headers(client)
        with patch("server.ai_service.generate_meta_tags", new_callable=AsyncMock) as mock:
            mock.return_value = {"title": "Test Title", "description": "Test Desc"}
            resp = client.post("/api/ai/meta-tags", json={
                "business_name": "TestBiz", "description": "A test business",
            }, headers=headers)
            assert resp.status_code == 200
            assert resp.json()["title"] == "Test Title"

    def test_keywords(self, client):
        headers = _auth_headers(client)
        with patch("server.ai_service.keyword_research", new_callable=AsyncMock) as mock:
            mock.return_value = {"keywords": ["kw1", "kw2"]}
            resp = client.post("/api/ai/keywords", json={
                "seed_topic": "coffee",
            }, headers=headers)
            assert resp.status_code == 200

    def test_competitors(self, client):
        headers = _auth_headers(client)
        with patch("server.ai_service.competitor_analysis", new_callable=AsyncMock) as mock:
            mock.return_value = {"analysis": "Competitor analysis result"}
            resp = client.post("/api/ai/competitors", json={
                "your_site": "https://me.com",
                "competitors": ["https://them.com"],
            }, headers=headers)
            assert resp.status_code == 200


# ====== HEALTH CHECK ======

class TestHealth:
    def test_root(self, client):
        resp = client.get("/api/")
        assert resp.status_code == 200
        assert resp.json()["service"] == "Goodly API"

    def test_health(self, client):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "database" in data
        assert "ai_service" in data
        assert "stripe" in data
        assert "email" in data
        assert "scheduler" in data


# ====== DASHBOARD ======

class TestDashboard:
    def test_summary(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/dashboard/summary", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "projects_count" in data
        assert "audits_count" in data

    def test_visibility(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/dashboard/visibility", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "breakdown" in data
        assert "weights" in data


# ====== BILLING ======

class TestBilling:
    def test_get_plans(self, client):
        resp = client.get("/api/billing/plans")
        assert resp.status_code == 200
        plans = resp.json()
        assert isinstance(plans, list)
        assert len(plans) > 0

    def test_billing_me(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/billing/me", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "plan" in data
        assert "usage" in data

    def test_checkout_invalid_plan(self, client):
        headers = _auth_headers(client)
        resp = client.post("/api/billing/checkout", json={
            "plan_id": "nonexistent", "origin_url": "https://goodly.app",
        }, headers=headers)
        assert resp.status_code == 400

    def test_checkout_free_plan(self, client):
        headers = _auth_headers(client)
        resp = client.post("/api/billing/checkout", json={
            "plan_id": "free", "origin_url": "https://goodly.app",
        }, headers=headers)
        assert resp.status_code == 400

    def test_billing_status_not_found(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/billing/status/fake-session", headers=headers)
        assert resp.status_code == 404

    def test_portal_no_customer(self, client):
        headers = _auth_headers(client)
        resp = client.post("/api/billing/portal", json={
            "return_url": "https://goodly.app",
        }, headers=headers)
        assert resp.status_code == 400


# ====== STRIPE WEBHOOK ======

class TestStripeWebhook:
    def test_webhook_received(self, client):
        # Webhook secret is configured in test env, so it should process
        resp = client.post("/api/webhook/stripe", content=b"{}")
        assert resp.status_code == 200
        assert resp.json()["received"] == False  # Invalid signature


# ====== PDF EXPORT ======

class TestPDF:
    def test_pdf_free_user_denied(self, client):
        headers, user = _register_and_login(client)
        resp = client.get("/api/audits/fake-id/pdf", headers=headers)
        assert resp.status_code == 402


# ====== SERP ======

class TestSERP:
    def test_serp_check_free_user_denied(self, client):
        headers, user = _register_and_login(client)
        resp = client.post("/api/serp/check", json={
            "keyword": "test", "domain": "example.com",
        }, headers=headers)
        assert resp.status_code == 402

    def test_serp_history(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/serp/history", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ====== SCHEDULE ======

class TestSchedule:
    def test_set_schedule_invalid(self, client):
        headers = _auth_headers(client)
        proj = client.post("/api/projects", json={
            "name": "Sched", "url": "https://sched.com",
        }, headers=headers).json()
        resp = client.post(f"/api/projects/{proj['id']}/schedule", json={
            "schedule": "weekly",
        }, headers=headers)
        assert resp.status_code == 400

    def test_set_schedule_off(self, client):
        headers = _auth_headers(client)
        proj = client.post("/api/projects", json={
            "name": "SchedOff", "url": "https://schedoff.com",
        }, headers=headers).json()
        resp = client.post(f"/api/projects/{proj['id']}/schedule", json={
            "schedule": "off",
        }, headers=headers)
        assert resp.status_code == 200

    def test_set_schedule_not_found(self, client):
        headers = _auth_headers(client)
        resp = client.post("/api/projects/fake-id/schedule", json={
            "schedule": "off",
        }, headers=headers)
        assert resp.status_code == 404


# ====== GBP ======

class TestGBP:
    def test_gbp_audit(self, client):
        headers = _auth_headers(client)
        with patch("server.gbp_service.audit_listing", new_callable=AsyncMock) as mock:
            mock.return_value = {"overall_score": 72, "categories": {}, "issues": []}
            resp = client.post("/api/gbp/audit", json={
                "business_name": "Test Cafe", "primary_category": "Cafe",
            }, headers=headers)
            assert resp.status_code == 200
            assert "id" in resp.json()

    def test_gbp_suggestions(self, client):
        headers = _auth_headers(client)
        with patch("server.gbp_service.suggestions", new_callable=AsyncMock) as mock:
            mock.return_value = {"suggestions": ["Add photos", "Update hours"]}
            resp = client.post("/api/gbp/suggestions", json={
                "business_name": "Test Cafe", "primary_category": "Cafe",
            }, headers=headers)
            assert resp.status_code == 200

    def test_gbp_competitors(self, client):
        headers = _auth_headers(client)
        with patch("server.gbp_service.compare_competitors", new_callable=AsyncMock) as mock:
            mock.return_value = {"comparison": "You vs them"}
            resp = client.post("/api/gbp/competitors", json={
                "business_name": "Test Cafe", "primary_category": "Cafe",
                "competitors": ["Other Cafe"],
            }, headers=headers)
            assert resp.status_code == 200

    def test_gbp_history(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/gbp/audits", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ====== AI VISIBILITY ======

class TestAIVisibility:
    def test_check(self, client):
        headers = _auth_headers(client)
        with patch("server.ai_visibility.check_ai_visibility", new_callable=AsyncMock) as mock:
            mock.return_value = {
                "overall_visibility_score": 45,
                "per_assistant": {},
                "blocking_factors": [],
                "improvement_plan": [],
            }
            resp = client.post("/api/ai-visibility/check", json={
                "business_name": "TestBiz", "category": "Software",
            }, headers=headers)
            assert resp.status_code == 200
            assert "id" in resp.json()

    def test_history(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/ai-visibility/history", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ====== SOCIAL ======

class TestSocial:
    def test_social_audit(self, client):
        headers = _auth_headers(client)
        with patch("server.social_fetcher.fetch_profile_signals", new_callable=AsyncMock) as mock_fetch:
            mock_fetch.return_value = {"followers": 1000, "posts": 50}
            with patch("server.social_service.audit_profile", new_callable=AsyncMock) as mock_ai:
                mock_ai.return_value = {"overall_score": 65, "categories": {}, "issues": []}
                resp = client.post("/api/social/audit", json={
                    "platform": "instagram", "handle": "testuser",
                }, headers=headers)
                assert resp.status_code == 200
                assert "id" in resp.json()

    def test_social_audit_invalid_platform(self, client):
        headers = _auth_headers(client)
        resp = client.post("/api/social/audit", json={
            "platform": "facebook", "handle": "testuser",
        }, headers=headers)
        assert resp.status_code == 400

    def test_social_suggestions(self, client):
        headers = _auth_headers(client)
        with patch("server.social_service.suggestions", new_callable=AsyncMock) as mock:
            mock.return_value = {"suggestions": ["Post more reels"]}
            resp = client.post("/api/social/suggestions", json={
                "platform": "instagram", "handle": "testuser",
            }, headers=headers)
            assert resp.status_code == 200

    def test_social_competitors(self, client):
        headers = _auth_headers(client)
        with patch("server.social_service.compare_competitors", new_callable=AsyncMock) as mock:
            mock.return_value = {"comparison": "You vs competitor"}
            resp = client.post("/api/social/competitors", json={
                "platform": "instagram", "your_handle": "me",
                "competitors": ["them"],
            }, headers=headers)
            assert resp.status_code == 200

    def test_social_history(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/social/audits", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ====== CONCIERGE ======

class TestConcierge:
    def test_brief_free_user_denied(self, client):
        headers, user = _register_and_login(client)
        resp = client.post("/api/concierge/brief", json={
            "business_name": "TestBiz", "website": "https://test.com",
            "primary_goal": "Get more customers",
        }, headers=headers)
        assert resp.status_code == 402

    def test_brief_admin(self, client):
        headers = _auth_headers(client)
        with patch("server.email_service.send_html_email", new_callable=AsyncMock):
            resp = client.post("/api/concierge/brief", json={
                "business_name": "AdminBiz", "website": "https://adminbiz.com",
                "primary_goal": "Growth",
            }, headers=headers)
            assert resp.status_code == 200
            assert "id" in resp.json()

    def test_get_brief(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/concierge/brief", headers=headers)
        assert resp.status_code == 200

    def test_admin_list_briefs(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/admin/concierge/briefs", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ====== SCHEDULER ======

class TestScheduler:
    def test_run_now_non_admin(self, client):
        headers, user = _register_and_login(client)
        resp = client.post("/api/scheduler/run-now", headers=headers)
        assert resp.status_code == 403

    def test_run_now_admin(self, client):
        headers = _auth_headers(client)
        with patch("server.scheduler_mod.run_due_audits", new_callable=AsyncMock) as mock:
            mock.return_value = {"ran": 0, "errors": 0}
            resp = client.post("/api/scheduler/run-now", headers=headers)
            assert resp.status_code == 200

    def test_scheduler_runs(self, client):
        headers = _auth_headers(client)
        resp = client.get("/api/scheduler/runs", headers=headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)


# ====== ERROR HANDLING ======

class TestErrors:
    def test_404_not_found(self, client):
        resp = client.get("/api/nonexistent-route")
        assert resp.status_code == 404

    def test_401_missing_auth(self, client):
        resp = client.get("/api/projects")
        assert resp.status_code == 401

    def test_401_invalid_token(self, client):
        resp = client.get("/api/projects", headers={"Authorization": "Bearer fake-token"})
        assert resp.status_code == 401

    def test_422_validation(self, client):
        resp = client.post("/api/auth/register", json={"email": "not-an-email"})
        assert resp.status_code == 422


# ====== CORS ======

class TestCORS:
    def test_cors_configured(self, client):
        from server import app
        cors = [m for m in app.user_middleware if m.cls.__name__ == "CORSMiddleware"]
        assert len(cors) > 0
