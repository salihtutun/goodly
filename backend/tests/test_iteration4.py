"""Iteration 4 (Goodly): Concierge brief CRUD + Stripe subscription checkout."""
import os
import uuid
import inspect
import requests
import pytest
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
load_dotenv("/app/frontend/.env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@smallbiz.com"
DEMO_PASS = "demo1234"
ADMIN_EMAIL = "admin@goodly.app"
ADMIN_PASS = "admin123"


def H(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def db():
    client = MongoClient(os.environ["MONGO_URL"])
    yield client[os.environ["DB_NAME"]]
    client.close()


@pytest.fixture(scope="module")
def demo_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=30)
    assert r.status_code == 200, f"demo login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="module")
def admin_token():
    # try new email first, fall back to legacy
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASS}, timeout=30)
    if r.status_code != 200:
        r = requests.post(f"{API}/auth/login", json={"email": "admin@seoframework.com", "password": ADMIN_PASS}, timeout=30)
    assert r.status_code == 200, f"admin login failed: {r.text}"
    return r.json()["token"]


@pytest.fixture
def free_user_token(db):
    """Register a fresh free-plan user."""
    email = f"TEST_iter4_free_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(f"{API}/auth/register", json={"email": email, "password": "testpass123", "name": "Free"}, timeout=15)
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    yield token
    # cleanup
    db.users.delete_one({"email": email})
    db.concierge_briefs.delete_many({"user_email": email})


# --- Module: Concierge brief CRUD ---
class TestConciergeBrief:
    def setup_method(self):
        # Clean demo user's brief before each test for isolation
        client = MongoClient(os.environ["MONGO_URL"])
        d = client[os.environ["DB_NAME"]]
        d.concierge_briefs.delete_many({"user_email": DEMO_EMAIL})
        client.close()

    def test_get_brief_returns_null_when_none(self, demo_token):
        r = requests.get(f"{API}/concierge/brief", headers=H(demo_token), timeout=15)
        assert r.status_code == 200
        assert r.json() is None

    def test_post_brief_concierge_user_saves_all_fields(self, demo_token):
        payload = {
            "business_name": "TEST_Acme Pottery",
            "website": "https://acmepottery.example",
            "industry": "Retail",
            "location": "Portland, OR",
            "target_keywords": ["handmade mugs", "pottery classes"],
            "competitors": ["competitor1.com", "competitor2.com"],
            "primary_goal": "Rank #1 for handmade mugs in Portland",
            "target_customer": "Local gift buyers",
            "brand_voice": "Warm and crafty",
            "monthly_traffic_goal": "5000",
            "blockers": "No SEO before",
            "contact_phone": "555-1234",
            "preferred_meeting_time": "Tuesdays 2pm PST",
        }
        r = requests.post(f"{API}/concierge/brief", headers=H(demo_token), json=payload, timeout=15)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["business_name"] == "TEST_Acme Pottery"
        assert data["website"] == payload["website"]
        assert data["target_keywords"] == payload["target_keywords"]
        assert data["competitors"] == payload["competitors"]
        assert data["primary_goal"] == payload["primary_goal"]
        assert "id" in data and "user_id" in data
        assert "_id" not in data

        # GET verifies persistence
        r2 = requests.get(f"{API}/concierge/brief", headers=H(demo_token), timeout=15)
        assert r2.status_code == 200
        got = r2.json()
        assert got is not None
        assert got["business_name"] == "TEST_Acme Pottery"
        assert got["target_keywords"] == payload["target_keywords"]

    def test_post_brief_is_upsert(self, demo_token, db):
        p1 = {"business_name": "TEST_v1", "website": "https://v1.example",
              "target_keywords": ["a"], "competitors": [], "primary_goal": "G1"}
        r = requests.post(f"{API}/concierge/brief", headers=H(demo_token), json=p1, timeout=15)
        assert r.status_code == 200
        first_id = r.json()["id"]

        p2 = {**p1, "business_name": "TEST_v2", "primary_goal": "G2", "target_keywords": ["b", "c"]}
        r2 = requests.post(f"{API}/concierge/brief", headers=H(demo_token), json=p2, timeout=15)
        assert r2.status_code == 200
        second = r2.json()
        assert second["business_name"] == "TEST_v2"
        assert second["primary_goal"] == "G2"
        assert second["target_keywords"] == ["b", "c"]

        # Verify only ONE brief exists for this user
        user = db.users.find_one({"email": DEMO_EMAIL})
        count = db.concierge_briefs.count_documents({"user_id": user["id"]})
        assert count == 1, f"expected 1 brief, found {count}"

        # Verify unique index exists
        idx = db.concierge_briefs.index_information()
        unique_user_id = any(
            spec.get("unique") and any(k[0] == "user_id" for k in spec.get("key", []))
            for spec in idx.values()
        )
        assert unique_user_id, f"no unique index on user_id: {idx}"

    def test_post_brief_free_user_402(self, free_user_token):
        payload = {
            "business_name": "TEST_Free Co",
            "website": "https://free.example",
            "target_keywords": [],
            "competitors": [],
            "primary_goal": "rank",
        }
        r = requests.post(f"{API}/concierge/brief", headers=H(free_user_token), json=payload, timeout=15)
        assert r.status_code == 402, r.text
        detail = r.json().get("detail", "")
        assert "Concierge brief is for done-for-you customers" in detail

    def test_brief_requires_auth(self):
        r = requests.post(f"{API}/concierge/brief", json={"business_name": "x", "website": "y", "primary_goal": "g"}, timeout=15)
        assert r.status_code in (401, 403)
        r2 = requests.get(f"{API}/concierge/brief", timeout=15)
        assert r2.status_code in (401, 403)


# --- Module: Admin brief listing ---
class TestAdminBriefs:
    def test_admin_briefs_requires_admin(self, demo_token):
        r = requests.get(f"{API}/admin/concierge/briefs", headers=H(demo_token), timeout=15)
        assert r.status_code == 403
        assert "Admin only" in (r.json().get("detail") or "")

    def test_admin_briefs_requires_auth(self):
        r = requests.get(f"{API}/admin/concierge/briefs", timeout=15)
        assert r.status_code in (401, 403)

    def test_admin_briefs_returns_list(self, admin_token, demo_token):
        # Ensure at least one brief exists
        payload = {"business_name": "TEST_Admin Visible", "website": "https://x.example",
                   "target_keywords": ["k"], "competitors": [], "primary_goal": "win"}
        requests.post(f"{API}/concierge/brief", headers=H(demo_token), json=payload, timeout=15)

        r = requests.get(f"{API}/admin/concierge/briefs", headers=H(admin_token), timeout=15)
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 1
        # No _id leak
        for it in items:
            assert "_id" not in it
            assert "user_id" in it
            assert "business_name" in it
        names = [it["business_name"] for it in items]
        assert "TEST_Admin Visible" in names


# --- Module: Billing checkout for concierge plan (Emergent fallback) ---
class TestConciergeCheckout:
    def test_checkout_concierge_uses_fallback_when_price_id_unset(self, demo_token, db):
        # Pre-cond: STRIPE_PRICE_ID_CONCIERGE empty/unset
        assert not os.environ.get("STRIPE_PRICE_ID_CONCIERGE"), \
            "Test assumes STRIPE_PRICE_ID_CONCIERGE is empty"
        payload = {"plan_id": "concierge", "origin_url": BASE_URL}
        r = requests.post(f"{API}/billing/checkout", headers=H(demo_token), json=payload, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "session_id" in data and data["session_id"]
        assert data["session_id"].startswith("cs_"), f"unexpected session_id: {data['session_id']}"
        assert "url" in data and "stripe.com" in data["url"]

        # Verify a payment_transactions row was created
        tx = db.payment_transactions.find_one({"session_id": data["session_id"]})
        assert tx is not None
        assert tx["plan_id"] == "concierge"
        assert tx["amount"] == 1000.0

    def test_checkout_invalid_plan(self, demo_token):
        r = requests.post(f"{API}/billing/checkout", headers=H(demo_token),
                          json={"plan_id": "bogus", "origin_url": BASE_URL}, timeout=15)
        assert r.status_code == 400

    def test_checkout_free_plan_rejected(self, demo_token):
        r = requests.post(f"{API}/billing/checkout", headers=H(demo_token),
                          json={"plan_id": "free", "origin_url": BASE_URL}, timeout=15)
        assert r.status_code == 400


# --- Module: billing.py code review — verify subscription-mode branch exists ---
class TestBillingCodeReview:
    def test_create_subscription_checkout_has_both_branches(self):
        import sys
        sys.path.insert(0, "/app/backend")
        import billing
        src = inspect.getsource(billing.create_subscription_checkout)
        # subscription-mode branch
        assert 'mode="subscription"' in src or "mode='subscription'" in src
        assert "line_items" in src
        assert '"price": price_id' in src or "'price': price_id" in src
        assert "stripe_sdk.checkout.Session.create" in src
        # Emergent fallback branch
        assert "CheckoutSessionRequest" in src or "create_checkout_session" in src

    def test_concierge_plan_declares_price_env(self):
        import billing
        plan = billing.PLANS["concierge"]
        assert plan["stripe_price_env"] == "STRIPE_PRICE_ID_CONCIERGE"
        assert plan["perks"]["done_for_you"] is True

    def test_normalized_session_shape(self):
        import billing
        s = billing._NormalizedSession("cs_test_123", "https://stripe.com/x")
        assert s.session_id == "cs_test_123"
        assert s.url == "https://stripe.com/x"


# --- Module: Regression — core flows still work ---
class TestRegression:
    def test_plans_has_free_and_concierge(self):
        r = requests.get(f"{API}/billing/plans", timeout=15)
        assert r.status_code == 200
        plans = r.json()
        ids = {p["id"] for p in plans}
        assert "free" in ids
        assert "concierge" in ids
        concierge = next(p for p in plans if p["id"] == "concierge")
        assert concierge["price_usd"] == 1000.0
        assert concierge["perks"]["done_for_you"] is True

    def test_demo_user_is_concierge(self, demo_token):
        r = requests.get(f"{API}/auth/me", headers=H(demo_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["plan"] == "concierge"

    def test_admin_user_is_admin_role(self, admin_token):
        r = requests.get(f"{API}/auth/me", headers=H(admin_token), timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["role"] == "admin"
        assert body["plan"] == "concierge"

    def test_dashboard_summary(self, demo_token):
        r = requests.get(f"{API}/dashboard/summary", headers=H(demo_token), timeout=15)
        assert r.status_code == 200
        body = r.json()
        for k in ("projects_count", "audits_count", "average_score", "recent_audits"):
            assert k in body

    def test_billing_me_concierge(self, demo_token):
        r = requests.get(f"{API}/billing/me", headers=H(demo_token), timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["plan"]["id"] == "concierge"
        assert body["plan"]["price_usd"] == 1000.0
