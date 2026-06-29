"""Iteration 5 (Goodly): Social presence audit endpoints (Instagram/TikTok/YouTube)."""
import os
import requests
import pytest
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
load_dotenv("/app/frontend/.env")

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@smallbiz.com"
DEMO_PASS = "demo1234"

# Claude calls can take 5-15 seconds
AI_TIMEOUT = 120


def H(t):
    return {"Authorization": f"Bearer {t}", "Content-Type": "application/json"}


@pytest.fixture(scope="module")
def demo_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASS}, timeout=30)
    assert r.status_code == 200, f"demo login failed: {r.text}"
    return r.json()["token"]


# --- Module: Auth gating ---
class TestSocialAuth:
    def test_audit_requires_auth(self):
        r = requests.post(f"{API}/social/audit", json={"platform": "instagram", "handle": "x"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_suggestions_requires_auth(self):
        r = requests.post(f"{API}/social/suggestions", json={"platform": "instagram", "handle": "x"}, timeout=15)
        assert r.status_code in (401, 403)

    def test_competitors_requires_auth(self):
        r = requests.post(f"{API}/social/competitors", json={"platform": "instagram", "your_handle": "x", "competitors": ["a"]}, timeout=15)
        assert r.status_code in (401, 403)

    def test_audits_history_requires_auth(self):
        r = requests.get(f"{API}/social/audits", timeout=15)
        assert r.status_code in (401, 403)


# --- Module: Platform validation ---
class TestPlatformValidation:
    def test_invalid_platform_audit(self, demo_token):
        r = requests.post(f"{API}/social/audit",
                          headers=H(demo_token),
                          json={"platform": "twitter", "handle": "@x", "niche": "n"},
                          timeout=15)
        assert r.status_code == 400, r.text
        assert "platform must be one of" in (r.json().get("detail") or "")

    def test_invalid_platform_suggestions(self, demo_token):
        r = requests.post(f"{API}/social/suggestions",
                          headers=H(demo_token),
                          json={"platform": "linkedin", "handle": "x"},
                          timeout=15)
        assert r.status_code == 400

    def test_invalid_platform_competitors(self, demo_token):
        r = requests.post(f"{API}/social/competitors",
                          headers=H(demo_token),
                          json={"platform": "facebook", "your_handle": "x", "competitors": ["a"]},
                          timeout=15)
        assert r.status_code == 400


# --- Module: Audit endpoint for all 3 platforms ---
class TestSocialAudit:
    @pytest.mark.parametrize("platform", ["instagram", "tiktok", "youtube"])
    def test_audit_platform_returns_valid_shape(self, demo_token, platform):
        payload = {
            "platform": platform,
            "handle": f"@acmepottery_{platform}",
            "bio": "Handmade ceramic mugs in Portland.",
            "niche": "pottery studio",
            "location": "Portland, OR",
            "followers": "1200",
            "recent_caption": "New batch of moss-green mugs just dropped!",
            "posts_per_week": "3",
        }
        r = requests.post(f"{API}/social/audit", headers=H(demo_token), json=payload, timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        # Top-level doc
        assert "id" in data
        assert data["platform"] == platform
        assert data["handle"] == f"acmepottery_{platform}"  # stripped of @
        assert "_id" not in data
        # AI result
        result = data["result"]
        assert isinstance(result["overall_score"], int)
        assert 0 <= result["overall_score"] <= 100
        assert isinstance(result["headline"], str) and result["headline"]
        cats = result["categories"]
        for key in ("bio_clarity", "niche_signal", "cta_presence", "content_quality", "consistency", "discoverability"):
            assert key in cats, f"missing category {key} in {cats.keys()}"
            assert isinstance(cats[key], int)
        assert isinstance(result["issues"], list) and len(result["issues"]) >= 1
        assert isinstance(result["quick_wins"], list) and len(result["quick_wins"]) >= 1
        # Issues should have expected keys
        i0 = result["issues"][0]
        for k in ("severity", "category", "message", "fix"):
            assert k in i0

    def test_audit_persists_to_db_and_history_returns_it(self, demo_token):
        payload = {
            "platform": "instagram",
            "handle": "@persist_test_handle",
            "bio": "test",
            "niche": "test niche",
        }
        r = requests.post(f"{API}/social/audit", headers=H(demo_token), json=payload, timeout=AI_TIMEOUT)
        assert r.status_code == 200
        new_id = r.json()["id"]

        # GET history
        r2 = requests.get(f"{API}/social/audits", headers=H(demo_token), timeout=15)
        assert r2.status_code == 200
        items = r2.json()
        assert isinstance(items, list)
        ids = [i["id"] for i in items]
        assert new_id in ids, f"newly created audit {new_id} not in history"
        for it in items:
            assert "_id" not in it

    def test_audit_history_platform_filter(self, demo_token):
        # Filter to instagram only
        r = requests.get(f"{API}/social/audits?platform=instagram", headers=H(demo_token), timeout=15)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        for it in items:
            assert it["platform"] == "instagram"


# --- Module: Suggestions endpoint ---
class TestSocialSuggestions:
    @pytest.mark.parametrize("platform", ["instagram", "tiktok", "youtube"])
    def test_suggestions_shape(self, demo_token, platform):
        payload = {
            "platform": platform,
            "handle": "acmepottery",
            "bio": "Handmade mugs.",
            "niche": "pottery studio",
            "location": "Portland, OR",
            "target_customer": "gift buyers",
        }
        r = requests.post(f"{API}/social/suggestions", headers=H(demo_token), json=payload, timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        # bio_rewrites: list of 3 with text/length/rationale
        assert isinstance(data["bio_rewrites"], list) and len(data["bio_rewrites"]) >= 1
        b0 = data["bio_rewrites"][0]
        for k in ("text", "length", "rationale"):
            assert k in b0
        # hashtag_sets: list with theme + tags
        assert isinstance(data["hashtag_sets"], list) and len(data["hashtag_sets"]) >= 1
        h0 = data["hashtag_sets"][0]
        assert "theme" in h0 and "tags" in h0
        assert isinstance(h0["tags"], list)
        # content_ideas
        assert isinstance(data["content_ideas"], list) and len(data["content_ideas"]) >= 1
        c0 = data["content_ideas"][0]
        for k in ("title", "format", "hook", "why"):
            assert k in c0
        # cta_examples
        assert isinstance(data["cta_examples"], list) and len(data["cta_examples"]) >= 1


# --- Module: Competitors endpoint ---
class TestSocialCompetitors:
    def test_competitors_shape_instagram(self, demo_token):
        payload = {
            "platform": "instagram",
            "your_handle": "acmepottery",
            "your_niche": "handmade pottery",
            "competitors": ["@eastforkpottery", "@heath_ceramics", "@potteryforall"],
        }
        r = requests.post(f"{API}/social/competitors", headers=H(demo_token), json=payload, timeout=AI_TIMEOUT)
        assert r.status_code == 200, r.text
        data = r.json()
        assert isinstance(data["overview"], str) and data["overview"]
        assert isinstance(data["competitor_summaries"], list) and len(data["competitor_summaries"]) >= 1
        cs0 = data["competitor_summaries"][0]
        for k in ("handle", "likely_strengths", "likely_content_style", "estimated_audience"):
            assert k in cs0
        assert isinstance(data["your_opportunities"], list) and len(data["your_opportunities"]) >= 1
        o0 = data["your_opportunities"][0]
        for k in ("opportunity", "why", "first_step"):
            assert k in o0
        assert isinstance(data["content_gaps"], list) and len(data["content_gaps"]) >= 1
        g0 = data["content_gaps"][0]
        for k in ("topic", "format", "why"):
            assert k in g0
        assert isinstance(data["quick_wins"], list) and len(data["quick_wins"]) >= 1


# --- Module: Regression — earlier flows still work ---
class TestRegression:
    def test_plans_still_has_free_and_concierge(self):
        r = requests.get(f"{API}/billing/plans", timeout=15)
        assert r.status_code == 200
        ids = {p["id"] for p in r.json()}
        assert "free" in ids and "concierge" in ids

    def test_dashboard_summary(self, demo_token):
        r = requests.get(f"{API}/dashboard/summary", headers=H(demo_token), timeout=15)
        assert r.status_code == 200

    def test_concierge_brief_endpoint_alive(self, demo_token):
        r = requests.get(f"{API}/concierge/brief", headers=H(demo_token), timeout=15)
        assert r.status_code == 200

    def test_demo_user_concierge(self, demo_token):
        r = requests.get(f"{API}/auth/me", headers=H(demo_token), timeout=15)
        assert r.status_code == 200
        assert r.json()["plan"] == "concierge"
