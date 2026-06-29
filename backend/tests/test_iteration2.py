"""Iteration 2 backend tests: billing, PDF, SERP, schedule, onboarding, free-tier limits."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@smallbiz.com"
DEMO_PASS = "demo1234"


def _login(email, password):
    r = requests.post(f"{API}/auth/login", json={"email": email, "password": password}, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()


def _register(email=None, password="test1234"):
    email = email or f"TEST_user_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": password, "name": "Free User"}, timeout=20)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="session")
def demo_auth():
    data = _login(DEMO_EMAIL, DEMO_PASS)
    return {"token": data["token"], "user": data["user"], "headers": {"Authorization": f"Bearer {data['token']}", "Content-Type": "application/json"}}


@pytest.fixture(scope="session")
def free_auth():
    data = _register()
    return {"token": data["token"], "user": data["user"], "headers": {"Authorization": f"Bearer {data['token']}", "Content-Type": "application/json"}}


# --- Plan / /me ---
class TestPlanAndOnboarding:
    def test_demo_user_is_pro(self, demo_auth):
        assert demo_auth["user"]["plan"] == "concierge"
        r = requests.get(f"{API}/auth/me", headers=demo_auth["headers"], timeout=15)
        assert r.status_code == 200
        assert r.json()["plan"] == "concierge"

    def test_new_user_is_free_and_not_onboarded(self, free_auth):
        assert free_auth["user"]["plan"] == "free"
        assert free_auth["user"]["onboarded"] is False

    def test_mark_onboarded(self, free_auth):
        r = requests.post(f"{API}/auth/onboarded", headers=free_auth["headers"], timeout=15)
        assert r.status_code == 200
        assert r.json().get("ok") is True
        me = requests.get(f"{API}/auth/me", headers=free_auth["headers"], timeout=15).json()
        assert me["onboarded"] is True


# --- Billing plans / status ---
class TestBilling:
    def test_get_plans(self):
        r = requests.get(f"{API}/billing/plans", timeout=15)
        assert r.status_code == 200
        plans = r.json()
        ids = {p["id"] for p in plans}
        assert {"free", "concierge", "concierge"}.issubset(ids)
        pro = next(p for p in plans if p["id"] == "concierge")
        assert pro["price_usd"] == 19.0
        assert pro["perks"]["pdf_export"] is True

    def test_billing_me_demo(self, demo_auth):
        r = requests.get(f"{API}/billing/me", headers=demo_auth["headers"], timeout=15)
        assert r.status_code == 200
        data = r.json()
        assert data["plan"]["id"] == "concierge"
        assert "usage" in data and "transactions" in data
        assert "audits_this_month" in data["usage"]

    def test_checkout_creates_stripe_session(self, demo_auth):
        r = requests.post(
            f"{API}/billing/checkout",
            json={"plan_id": "concierge", "origin_url": BASE_URL},
            headers=demo_auth["headers"], timeout=30,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "session_id" in data and "url" in data
        assert data["url"].startswith("https://checkout.stripe.com") or data["url"].startswith("https://")
        # Store for next test via class attribute
        TestBilling.session_id = data["session_id"]

    def test_checkout_invalid_plan(self, demo_auth):
        r = requests.post(
            f"{API}/billing/checkout",
            json={"plan_id": "free", "origin_url": BASE_URL},
            headers=demo_auth["headers"], timeout=15,
        )
        assert r.status_code == 400

    def test_billing_status_existing_session(self, demo_auth):
        sid = getattr(TestBilling, "session_id", None)
        assert sid, "No session_id from checkout"
        r = requests.get(f"{API}/billing/status/{sid}", headers=demo_auth["headers"], timeout=30)
        assert r.status_code == 200
        body = r.json()
        assert body["session_id"] == sid
        assert "status" in body and "payment_status" in body

    def test_billing_status_nonexistent_session(self, demo_auth):
        r = requests.get(f"{API}/billing/status/cs_test_does_not_exist_xyz", headers=demo_auth["headers"], timeout=15)
        assert r.status_code == 404


# --- PDF export ---
class TestPDF:
    def test_pdf_for_pro_user(self, demo_auth):
        # Find an existing audit
        r = requests.get(f"{API}/audits", headers=demo_auth["headers"], timeout=15)
        assert r.status_code == 200
        audits = r.json()
        if not audits:
            # Run a quick audit
            ra = requests.post(f"{API}/audits", json={"url": "https://example.com"}, headers=demo_auth["headers"], timeout=90)
            assert ra.status_code == 200
            audit_id = ra.json()["id"]
        else:
            audit_id = audits[0]["id"]
        r = requests.get(f"{API}/audits/{audit_id}/pdf", headers=demo_auth["headers"], timeout=30)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")
        assert r.content[:5] == b"%PDF-"
        assert len(r.content) > 5000

    def test_pdf_blocked_for_free(self, free_auth):
        # free user has no audits yet — try with a random id; expect 402 before 404 (plan check first)
        fake_id = "nonexistent-audit-id"
        r = requests.get(f"{API}/audits/{fake_id}/pdf", headers=free_auth["headers"], timeout=15)
        assert r.status_code == 402
        assert "Pro feature" in r.json().get("detail", "")


# --- SERP ---
class TestSerp:
    def test_serp_check_pro(self, demo_auth):
        r = requests.post(
            f"{API}/serp/check",
            json={"keyword": "example domain", "domain": "example.com"},
            headers=demo_auth["headers"], timeout=45,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert "rank" in data
        assert "results" in data
        # results may be empty if scraper failed, but should not 500
        assert isinstance(data["results"], list) or data["results"] is None

    def test_serp_blocked_free(self, free_auth):
        r = requests.post(
            f"{API}/serp/check",
            json={"keyword": "test", "domain": "example.com"},
            headers=free_auth["headers"], timeout=15,
        )
        assert r.status_code == 402
        assert "Pro feature" in r.json().get("detail", "")

    def test_serp_history(self, demo_auth):
        r = requests.get(f"{API}/serp/history", headers=demo_auth["headers"], timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


# --- Schedule ---
class TestSchedule:
    def test_schedule_pro(self, demo_auth):
        # Create a project to schedule
        pr = requests.post(
            f"{API}/projects",
            json={"name": f"TEST_Sched_{uuid.uuid4().hex[:6]}", "url": "https://example.com"},
            headers=demo_auth["headers"], timeout=15,
        )
        # may fail with 402 if project limit reached on demo (5 limit)
        if pr.status_code == 402:
            existing = requests.get(f"{API}/projects", headers=demo_auth["headers"], timeout=15).json()
            pid = existing[0]["id"]
        else:
            assert pr.status_code == 200, pr.text
            pid = pr.json()["id"]
        # Set monthly
        r = requests.post(f"{API}/projects/{pid}/schedule", json={"schedule": "monthly"}, headers=demo_auth["headers"], timeout=15)
        assert r.status_code == 200, r.text
        proj = r.json()
        assert proj["schedule"] == "monthly"
        assert proj.get("next_audit_at") is not None
        # Turn off
        r2 = requests.post(f"{API}/projects/{pid}/schedule", json={"schedule": "off"}, headers=demo_auth["headers"], timeout=15)
        assert r2.status_code == 200
        assert r2.json()["schedule"] == "off"
        # Cleanup
        requests.delete(f"{API}/projects/{pid}", headers=demo_auth["headers"], timeout=15)

    def test_schedule_blocked_free(self, free_auth):
        # Free user creates a project (limit 1), then attempts schedule
        pr = requests.post(
            f"{API}/projects",
            json={"name": f"TEST_FreeSched_{uuid.uuid4().hex[:6]}", "url": "https://example.com"},
            headers=free_auth["headers"], timeout=15,
        )
        if pr.status_code == 402:
            pid = requests.get(f"{API}/projects", headers=free_auth["headers"], timeout=15).json()[0]["id"]
        else:
            assert pr.status_code == 200
            pid = pr.json()["id"]
        r = requests.post(f"{API}/projects/{pid}/schedule", json={"schedule": "monthly"}, headers=free_auth["headers"], timeout=15)
        assert r.status_code == 402
        assert "Pro feature" in r.json().get("detail", "")


# --- Free tier limits ---
class TestFreeLimits:
    def test_project_limit_1(self):
        # Fresh free user
        u = _register()
        h = {"Authorization": f"Bearer {u['token']}", "Content-Type": "application/json"}
        # 1st project ok
        r1 = requests.post(f"{API}/projects", json={"name": "TEST_P1", "url": "https://example.com"}, headers=h, timeout=15)
        assert r1.status_code == 200, r1.text
        # 2nd should be 402
        r2 = requests.post(f"{API}/projects", json={"name": "TEST_P2", "url": "https://example.org"}, headers=h, timeout=15)
        assert r2.status_code == 402
        assert "limit reached" in r2.json().get("detail", "").lower() or "project limit" in r2.json().get("detail", "").lower()

    def test_audit_limit_3(self):
        u = _register()
        h = {"Authorization": f"Bearer {u['token']}", "Content-Type": "application/json"}
        # Run 3 audits then 4th should fail with 402
        for i in range(3):
            r = requests.post(f"{API}/audits", json={"url": "https://example.com"}, headers=h, timeout=90)
            assert r.status_code == 200, f"audit {i+1} failed: {r.text}"
        r4 = requests.post(f"{API}/audits", json={"url": "https://example.com"}, headers=h, timeout=90)
        assert r4.status_code == 402
        assert "3 audits" in r4.json().get("detail", "").lower() or "used your" in r4.json().get("detail", "").lower()
