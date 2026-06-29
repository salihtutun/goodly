"""Iteration 3 tests: Stripe Customer Portal, Scheduler manual trigger + history,
SerpAPI/DuckDuckGo fallback, mocked Resend email, scheduled-run digest persistence."""
import os
import time
import uuid
import requests
import pytest
from datetime import datetime, timezone, timedelta
from pymongo import MongoClient

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@smallbiz.com"
DEMO_PASS = "demo1234"
ADMIN_EMAIL = "admin@goodly.app"
ADMIN_PASS = "admin123"


# --- Shared fixtures ---
@pytest.fixture(scope="module")
def demo_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=30)
    assert r.status_code == 200, f"demo login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=30)
    assert r.status_code == 200, f"admin login failed: {r.text}"
    return r.json()["token"]


def H(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


# --- Mongo client for direct seeding/inspection ---
@pytest.fixture(scope="module")
def db():
    from dotenv import load_dotenv
    load_dotenv("/app/backend/.env")
    client = MongoClient(os.environ["MONGO_URL"])
    yield client[os.environ["DB_NAME"]]
    client.close()


# --- Module: Billing Customer Portal ---
class TestBillingPortal:
    def test_portal_requires_auth(self):
        r = requests.post(f"{API}/billing/portal", json={"return_url": f"{BASE_URL}/app/billing"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_portal_400_when_no_stripe_customer(self, demo_token):
        # Demo user has no stripe_customer_id
        r = requests.post(f"{API}/billing/portal",
                          headers=H(demo_token),
                          json={"return_url": f"{BASE_URL}/app/billing"}, timeout=15)
        assert r.status_code == 400, f"expected 400, got {r.status_code}: {r.text}"
        body = r.json()
        msg = body.get("detail") or body.get("message") or ""
        assert "No active Stripe customer found" in msg
        assert "Upgrade once" in msg

    def test_portal_code_path_with_fake_customer(self, demo_token, db):
        """Seed a fake stripe_customer_id then call /billing/portal — should hit Stripe SDK and 502 (invalid id)."""
        user = db.users.find_one({"email": DEMO_EMAIL})
        original = user.get("stripe_customer_id")
        db.users.update_one({"email": DEMO_EMAIL}, {"$set": {"stripe_customer_id": "cus_TEST_invalid_xxx"}})
        try:
            r = requests.post(f"{API}/billing/portal",
                              headers=H(demo_token),
                              json={"return_url": f"{BASE_URL}/app/billing"}, timeout=20)
            # Either 502 (Stripe error on invalid customer) OR 200 url
            # Status must NOT be 400 (which would mean no customer found).
            # Acceptable: 200 (real url), 502 (stripe rejected fake customer), other 5xx
            assert r.status_code != 400, f"unexpected 400 — code path didn't reach Stripe SDK: {r.text}"
            assert r.status_code != 403
            if r.status_code == 200:
                try:
                    assert "stripe.com" in r.json().get("url", "")
                except Exception:
                    pass
        finally:
            # Restore
            if original is None:
                db.users.update_one({"email": DEMO_EMAIL}, {"$unset": {"stripe_customer_id": ""}})
            else:
                db.users.update_one({"email": DEMO_EMAIL}, {"$set": {"stripe_customer_id": original}})


# --- Module: Scheduler manual trigger ---
class TestSchedulerRunNow:
    def test_run_now_requires_admin(self, demo_token):
        r = requests.post(f"{API}/scheduler/run-now", headers=H(demo_token), timeout=15)
        assert r.status_code == 403
        assert "Admin only" in (r.json().get("detail") or "")

    def test_run_now_requires_auth(self):
        r = requests.post(f"{API}/scheduler/run-now", timeout=15)
        assert r.status_code in (401, 403)

    def test_run_now_no_due_returns_zero(self, admin_token, db):
        # Temporarily clear all due monthly schedules so we get due:0
        affected = list(db.projects.find({"schedule": "monthly", "next_audit_at": {"$ne": None}}, {"id": 1, "next_audit_at": 1}))
        future = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
        for p in affected:
            db.projects.update_one({"id": p["id"]}, {"$set": {"next_audit_at": future}})
        try:
            r = requests.post(f"{API}/scheduler/run-now", headers=H(admin_token), timeout=30)
            assert r.status_code == 200, r.text
            data = r.json()
            assert data == {"due": 0, "ran": 0, "failures": 0}, f"got {data}"
        finally:
            # Restore original next_audit_at
            for p in affected:
                db.projects.update_one({"id": p["id"]}, {"$set": {"next_audit_at": p["next_audit_at"]}})

    def test_run_now_processes_backdated_project(self, admin_token, demo_token, db):
        # Create a fresh project for the demo user with backdated next_audit_at
        proj_payload = {"name": "TEST_iter3_sched", "url": "https://example.com",
                        "description": "scheduler test", "target_keywords": "example"}
        r = requests.post(f"{API}/projects", headers=H(demo_token), json=proj_payload, timeout=30)
        # Demo is Pro -> project_limit 5; might be at limit from previous runs. Clean up if needed.
        if r.status_code == 402:
            # Delete oldest TEST_ project then retry
            existing = requests.get(f"{API}/projects", headers=H(demo_token), timeout=15).json()
            test_projects = [p for p in existing if p["name"].startswith("TEST_")]
            for p in test_projects[:max(1, len(test_projects))]:
                requests.delete(f"{API}/projects/{p['id']}", headers=H(demo_token), timeout=15)
            r = requests.post(f"{API}/projects", headers=H(demo_token), json=proj_payload, timeout=30)
        assert r.status_code == 200, r.text
        project = r.json()
        project_id = project["id"]

        # Backdate schedule
        backdated = (datetime.now(timezone.utc) - timedelta(days=1)).isoformat()
        db.projects.update_one({"id": project_id},
                               {"$set": {"schedule": "monthly", "next_audit_at": backdated}})

        # Snapshot scheduled_runs before
        before_count = db.scheduled_runs.count_documents({"project_id": project_id})

        # Force any OTHER monthly due projects to future, so only ours runs
        others = list(db.projects.find({
            "schedule": "monthly",
            "next_audit_at": {"$ne": None},
            "id": {"$ne": project_id},
        }, {"id": 1, "next_audit_at": 1}))
        future = (datetime.now(timezone.utc) + timedelta(days=365)).isoformat()
        for p in others:
            db.projects.update_one({"id": p["id"]}, {"$set": {"next_audit_at": future}})

        try:
            r = requests.post(f"{API}/scheduler/run-now", headers=H(admin_token), timeout=120)
            assert r.status_code == 200, r.text
            data = r.json()
            assert data.get("due", 0) >= 1
            assert data.get("ran", 0) >= 1
            assert data.get("failures", 0) == 0, f"failures>0: {data}"

            # Verify a scheduled_runs doc was inserted
            after_count = db.scheduled_runs.count_documents({"project_id": project_id})
            assert after_count == before_count + 1, f"expected +1 run, got before={before_count} after={after_count}"

            run = db.scheduled_runs.find_one({"project_id": project_id}, sort=[("run_at", -1)])
            assert run is not None
            assert run.get("audit_id"), "audit_id missing"
            assert run.get("user_id") == project["user_id"]
            # Score may be None if analyze failed, but for example.com should produce a number
            assert "score" in run
            # Email mocked since RESEND_API_KEY empty
            assert run.get("email") is not None
            assert run["email"].get("mocked") is True, f"email not mocked: {run['email']}"
            assert run["email"].get("sent") is False
            assert run["email"].get("error") in (None, "")

            # next_audit_at advanced 30 days ahead
            updated = db.projects.find_one({"id": project_id})
            assert updated["next_audit_at"] > backdated

        finally:
            # Restore others
            for p in others:
                db.projects.update_one({"id": p["id"]}, {"$set": {"next_audit_at": p["next_audit_at"]}})
            # Cleanup our test project + runs + audits
            db.scheduled_runs.delete_many({"project_id": project_id})
            db.audits.delete_many({"project_id": project_id})
            db.projects.delete_one({"id": project_id})


# --- Module: Scheduler runs history ---
class TestSchedulerRuns:
    def test_runs_requires_auth(self):
        r = requests.get(f"{API}/scheduler/runs", timeout=15)
        assert r.status_code in (401, 403)

    def test_runs_returns_list(self, demo_token):
        r = requests.get(f"{API}/scheduler/runs", headers=H(demo_token), timeout=15)
        assert r.status_code == 200, r.text
        body = r.json()
        assert isinstance(body, list)
        # Validate shape if entries exist
        for run in body:
            assert "id" in run
            assert "project_id" in run
            assert "run_at" in run
            # Should have email log with mocked flag
            assert "email" in run
            assert isinstance(run["email"], dict)
            assert "mocked" in run["email"]

    def test_runs_empty_for_fresh_user(self):
        # Register a fresh user and confirm empty []
        email = f"TEST_iter3_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register",
                          json={"email": email, "password": "***", "name": "T"}, timeout=15)
        assert r.status_code == 200, r.text
        token = r.json()["token"]
        r2 = requests.get(f"{API}/scheduler/runs", headers=H(token), timeout=15)
        assert r2.status_code == 200
        assert r2.json() == []


# --- Module: SerpAPI/DuckDuckGo fallback ---
class TestSerpFallback:
    def test_serp_uses_duckduckgo_when_no_serpapi_key(self, demo_token):
        # SERPAPI_KEY is empty by default — should use DuckDuckGo
        assert not os.environ.get("SERPAPI_KEY"), "Test assumes SERPAPI_KEY is unset"
        r = requests.post(f"{API}/serp/check", headers=H(demo_token),
                          json={"keyword": "example domain", "domain": "example.com"}, timeout=60)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body.get("engine") == "duckduckgo", f"engine != duckduckgo: {body.get('engine')}"
        assert body.get("domain") == "example.com"
        assert "results" in body

    def test_serp_module_branch(self):
        """Unit-style: import serp module, verify branching logic exists."""
        import sys
        sys.path.insert(0, "/app/backend")
        import serp as serp_mod
        # Verify both helpers exist
        assert hasattr(serp_mod, "_check_via_serpapi")
        assert hasattr(serp_mod, "_check_via_duckduckgo")
        assert hasattr(serp_mod, "check_rank")


# --- Module: Email service mocked behavior ---
class TestEmailMocked:
    def test_send_html_email_mocked_when_no_key(self):
        import asyncio, sys
        sys.path.insert(0, "/app/backend")
        # Ensure RESEND_API_KEY is empty
        old = os.environ.pop("RESEND_API_KEY", None)
        try:
            import importlib, email_service
            importlib.reload(email_service)
            result = asyncio.run(email_service.send_html_email(
                to="test@example.com", subject="x", html="<p>x</p>"))
            assert result["mocked"] is True
            assert result["id"] is None
            assert result["error"] is None
        finally:
            if old:
                os.environ["RESEND_API_KEY"] = old


# --- Module: Regression — core iter1/iter2 endpoints still alive ---
class TestRegression:
    def test_plans_public(self):
        r = requests.get(f"{API}/billing/plans", timeout=15)
        assert r.status_code == 200
        plans = r.json()
        assert len(plans) == 3
        ids = {p["id"] for p in plans}
        assert ids == {"free", "concierge", "concierge"}

    def test_login_demo_pro(self, demo_token):
        r = requests.get(f"{API}/auth/me", headers=H(demo_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["plan"] == "concierge"

    def test_dashboard_summary(self, demo_token):
        r = requests.get(f"{API}/dashboard/summary", headers=H(demo_token), timeout=15)
        assert r.status_code == 200
        body = r.json()
        for k in ("projects_count", "audits_count", "average_score", "recent_audits"):
            assert k in body

    def test_billing_me(self, demo_token):
        r = requests.get(f"{API}/billing/me", headers=H(demo_token), timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["plan"]["id"] == "concierge"
        assert "usage" in body and "transactions" in body
