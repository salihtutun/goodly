"""Backend API tests for SEO Framework."""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://rank-helper-2.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@smallbiz.com"
DEMO_PASS = "demo1234"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "user" in data
    token = data["token"]
    return {"token": token, "headers": {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}}


# --- Health / root ---
def test_root():
    r = requests.get(f"{API}/", timeout=15)
    assert r.status_code == 200
    assert r.json().get("status") == "ok"


# --- Auth ---
class TestAuth:
    def test_login_demo(self, session):
        r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["user"]["email"] == DEMO_EMAIL
        assert isinstance(data["token"], str) and len(data["token"]) > 10
        # cookie set
        assert any(c.name == "access_token" for c in session.cookies)

    def test_login_bad_password(self, session):
        r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrongpass"}, timeout=20)
        assert r.status_code == 401

    def test_me_requires_auth(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401

    def test_me_with_token(self, auth):
        r = requests.get(f"{API}/auth/me", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == DEMO_EMAIL

    def test_register_new_user(self):
        email = f"TEST_user_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register", json={"email": email, "password": "test1234", "name": "Test User"}, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user"]["email"] == email.lower()
        assert "token" in data

    def test_register_duplicate(self):
        r = requests.post(f"{API}/auth/register", json={"email": DEMO_EMAIL, "password": "demo1234"}, timeout=20)
        assert r.status_code == 400

    def test_register_short_password(self):
        email = f"TEST_short_{uuid.uuid4().hex[:6]}@example.com"
        r = requests.post(f"{API}/auth/register", json={"email": email, "password": "abc"}, timeout=20)
        assert r.status_code == 422

    def test_logout(self):
        s = requests.Session()
        r = s.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=20)
        assert r.status_code == 200
        r2 = s.post(f"{API}/auth/logout", timeout=15)
        assert r2.status_code == 200


# --- Projects CRUD ---
class TestProjects:
    project_id = None

    def test_unauth_list(self):
        r = requests.get(f"{API}/projects", timeout=15)
        assert r.status_code == 401

    def test_create_project(self, auth):
        payload = {
            "name": f"TEST_Proj_{uuid.uuid4().hex[:6]}",
            "url": "https://example.com",
            "description": "test desc",
            "target_keywords": "seo, audit",
        }
        r = requests.post(f"{API}/projects", json=payload, headers=auth["headers"], timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == payload["name"]
        assert data["url"] == payload["url"]
        assert "id" in data
        TestProjects.project_id = data["id"]

    def test_get_project(self, auth):
        pid = TestProjects.project_id
        r = requests.get(f"{API}/projects/{pid}", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        assert r.json()["id"] == pid

    def test_list_projects(self, auth):
        r = requests.get(f"{API}/projects", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()]
        assert TestProjects.project_id in ids

    def test_update_project(self, auth):
        pid = TestProjects.project_id
        r = requests.patch(f"{API}/projects/{pid}", json={"description": "updated"}, headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        assert r.json()["description"] == "updated"

    def test_delete_project(self, auth):
        pid = TestProjects.project_id
        r = requests.delete(f"{API}/projects/{pid}", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        # confirm gone
        r2 = requests.get(f"{API}/projects/{pid}", headers=auth["headers"], timeout=15)
        assert r2.status_code == 404


# --- Audits ---
class TestAudits:
    audit_id = None

    def test_unauth_audit(self):
        r = requests.post(f"{API}/audits", json={"url": "https://example.com"}, timeout=15)
        assert r.status_code == 401

    def test_run_audit(self, auth):
        r = requests.post(f"{API}/audits", json={"url": "https://example.com"}, headers=auth["headers"], timeout=60)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and "result" in data
        assert "overall_score" in data["result"]
        TestAudits.audit_id = data["id"]

    def test_list_audits(self, auth):
        r = requests.get(f"{API}/audits", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        ids = [a["id"] for a in r.json()]
        assert TestAudits.audit_id in ids

    def test_get_audit_detail(self, auth):
        aid = TestAudits.audit_id
        r = requests.get(f"{API}/audits/{aid}", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        body = r.json()
        assert body["id"] == aid
        assert "result" in body
        # ai_recommendations may be present and a dict
        assert "ai_recommendations" in body


# --- Dashboard ---
class TestDashboard:
    def test_dashboard_summary(self, auth):
        r = requests.get(f"{API}/dashboard/summary", headers=auth["headers"], timeout=15)
        assert r.status_code == 200
        data = r.json()
        for k in ("projects_count", "audits_count", "average_score", "recent_audits"):
            assert k in data
        assert isinstance(data["recent_audits"], list)


# --- AI tools (slow Claude calls) ---
class TestAI:
    def test_ai_meta_tags(self, auth):
        r = requests.post(
            f"{API}/ai/meta-tags",
            json={"business_name": "Acme Bakery", "description": "Local bakery selling artisanal bread", "target_keywords": "bakery, bread"},
            headers=auth["headers"], timeout=60,
        )
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data, dict) and len(data) > 0

    def test_ai_keywords(self, auth):
        r = requests.post(
            f"{API}/ai/keywords",
            json={"seed_topic": "local bakery", "industry": "food", "location": "Austin"},
            headers=auth["headers"], timeout=60,
        )
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), dict)

    def test_ai_competitors(self, auth):
        r = requests.post(
            f"{API}/ai/competitors",
            json={"your_site": "https://example.com", "competitors": ["https://competitor1.com", "https://competitor2.com"], "industry": "food"},
            headers=auth["headers"], timeout=60,
        )
        assert r.status_code == 200, r.text
        assert isinstance(r.json(), dict)
