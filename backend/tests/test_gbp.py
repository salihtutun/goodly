"""Backend tests for Google Business Profile endpoints."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@smallbiz.com"
DEMO_PASS = "demo1234"


def H(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def demo_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=30)
    assert r.status_code == 200, f"demo login failed: {r.text}"
    return r.json()["token"]


class TestGBPAuth:
    def test_audit_requires_auth(self):
        r = requests.post(f"{API}/gbp/audit", json={"business_name": "Test", "primary_category": "Test"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_suggestions_requires_auth(self):
        r = requests.post(f"{API}/gbp/suggestions", json={"business_name": "Test", "primary_category": "Test"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_competitors_requires_auth(self):
        r = requests.post(f"{API}/gbp/competitors", json={"business_name": "Test", "primary_category": "Test", "competitors": ["A"]}, timeout=15)
        assert r.status_code in (401, 403)

    def test_history_requires_auth(self):
        r = requests.get(f"{API}/gbp/audits", timeout=15)
        assert r.status_code in (401, 403)


class TestGBPAudit:
    def test_audit_valid_submission(self, demo_token):
        r = requests.post(f"{API}/gbp/audit", json={
            "business_name": "Test Cafe",
            "primary_category": "Coffee Shop",
            "address": "123 Main St",
            "description": "Best coffee in town",
            "photo_count": 15,
            "reviews_count": 42,
            "avg_rating": 4.5,
        }, headers=H(demo_token), timeout=120)
        assert r.status_code == 200, f"audit failed: {r.text}"
        data = r.json()
        assert "id" in data
        assert "result" in data
        assert "overall_score" in data["result"]

    def test_audit_missing_required_fields(self, demo_token):
        r = requests.post(f"{API}/gbp/audit", json={"business_name": "Test"}, headers=H(demo_token), timeout=15)
        assert r.status_code == 422

    def test_audit_history(self, demo_token):
        r = requests.get(f"{API}/gbp/audits", headers=H(demo_token), timeout=15)
        assert r.status_code == 200
        assert isinstance(r.json(), list)


class TestGBPSuggestions:
    def test_suggestions_valid(self, demo_token):
        r = requests.post(f"{API}/gbp/suggestions", json={
            "business_name": "Test Cafe",
            "primary_category": "Coffee Shop",
            "location": "Portland, OR",
        }, headers=H(demo_token), timeout=120)
        assert r.status_code == 200, f"suggestions failed: {r.text}"


class TestGBPCompetitors:
    def test_competitors_valid(self, demo_token):
        r = requests.post(f"{API}/gbp/competitors", json={
            "business_name": "Test Cafe",
            "primary_category": "Coffee Shop",
            "location": "Portland, OR",
            "competitors": ["Starbucks", "Blue Bottle"],
        }, headers=H(demo_token), timeout=120)
        assert r.status_code == 200, f"competitors failed: {r.text}"
