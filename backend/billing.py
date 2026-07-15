"""Plans, limits, and Stripe checkout helpers.

Uses direct Stripe SDK — no Emergent dependency.
"""
import os
import asyncio
from datetime import datetime, timezone
from typing import Dict, Optional

import stripe as stripe_sdk


# Plan definitions (server-authoritative — never trust frontend prices)
PLANS: Dict[str, dict] = {
    "free": {
        "id": "free",
        "name": "Self-serve",
        "price_usd": 0.0,
        "audit_limit": 5,
        "project_limit": 2,
        "features": [
            "5 audits per month",
            "2 saved projects",
            "AI-generated action plan",
            "Try the tool — no card needed",
        ],
        "perks": {
            "pdf_export": False,
            "scheduled_audits": False,
            "serp_tracking": False,
            "competitor_analysis": False,
            "done_for_you": False,
            "social_audit": False,
            "ai_visibility": False,
            "gbp_audit": False,
        },
    },
    "starter": {
        "id": "starter",
        "name": "Starter",
        "price_usd": 49.0,
        "price_annual_usd": 490.0,  # $41/mo — 2 months free
        "audit_limit": 10,
        "project_limit": 3,
        "trial_days": 7,  # 7-day free trial
        "features": [
            "10 SEO audits per month",
            "3 saved projects",
            "5 SERP keyword trackers",
            "Weekly automated re-audits",
            "PDF reports for every audit",
            "Instagram audit + suggestions",
            "Email support within 24 hours",
        ],
        "perks": {
            "pdf_export": True,
            "scheduled_audits": True,
            "serp_tracking": True,
            "competitor_analysis": False,
            "done_for_you": False,
            "social_audit": True,
            "ai_visibility": False,
            "gbp_audit": False,
        },
        "stripe_price_env": "STRIPE_PRICE_ID_STARTER",
        "stripe_price_annual_env": "STRIPE_PRICE_ID_STARTER_ANNUAL",
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "price_usd": 149.0,
        "price_annual_usd": 1490.0,  # $124/mo — save $298
        "audit_limit": None,
        "project_limit": 15,
        "trial_days": 7,  # 7-day free trial
        "features": [
            "Unlimited SEO audits",
            "15 saved projects",
            "25 SERP keyword trackers",
            "Daily automated re-audits",
            "Competitor analysis (3 competitors)",
            "All social platforms (IG, TikTok, YouTube)",
            "AI visibility monitoring",
            "Google Business Profile audit",
            "White-label PDF reports",
            "Priority email support",
        ],
        "perks": {
            "pdf_export": True,
            "scheduled_audits": True,
            "serp_tracking": True,
            "competitor_analysis": True,
            "done_for_you": False,
            "social_audit": True,
            "ai_visibility": True,
            "gbp_audit": True,
        },
        "stripe_price_env": "STRIPE_PRICE_ID_PRO",
        "stripe_price_annual_env": "STRIPE_PRICE_ID_PRO_ANNUAL",
    },
    "concierge": {
        "id": "concierge",
        "name": "Concierge",
        "price_usd": 1000.0,
        "audit_limit": None,
        "project_limit": 25,
        "features": [
            "Done-for-you SEO — we do the work, you take the calls",
            "Dedicated SEO specialist on Slack/email",
            "Unlimited audits across up to 25 properties",
            "Weekly SERP rank tracking on your target keywords",
            "Monthly client-ready PDF report",
            "We rewrite meta tags, headings, and on-page copy",
            "Google Business Profile + local citations cleanup",
            "Backlink outreach to relevant local sites",
            "Goal: page-one ranking in 90 days or you don't pay month 4",
        ],
        "perks": {
            "pdf_export": True,
            "scheduled_audits": True,
            "serp_tracking": True,
            "competitor_analysis": True,
            "done_for_you": True,
            "social_audit": True,
            "ai_visibility": True,
            "gbp_audit": True,
        },
        "stripe_price_env": "STRIPE_PRICE_ID_CONCIERGE",
    },
}


def get_plan(plan_id: Optional[str]) -> dict:
    return PLANS.get(plan_id or "free", PLANS["free"])


def month_key(dt: Optional[datetime] = None) -> str:
    d = dt or datetime.now(timezone.utc)
    return d.strftime("%Y-%m")


def _price_id_for(plan: dict) -> Optional[str]:
    env_name = plan.get("stripe_price_env")
    if not env_name:
        return None
    pid = os.environ.get(env_name)
    return pid.strip() if pid else None


class _NormalizedSession:
    def __init__(self, session_id: str, url: str):
        self.session_id = session_id
        self.url = url


async def create_subscription_checkout(
    *,
    host_url: str,
    plan_id: str,
    user_id: str,
    user_email: str,
    origin_url: str,
):
    """Returns (session, plan). Uses real subscription mode when a Stripe Price ID
    is configured, otherwise falls back to one-time payment mode for dev/test."""
    plan = PLANS.get(plan_id)
    if not plan or plan_id == "free":
        raise ValueError("Invalid plan for checkout")

    success_url = f"{origin_url.rstrip('/')}/app/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url.rstrip('/')}/app/billing?cancelled=1"
    metadata = {
        "user_id": user_id,
        "user_email": user_email,
        "plan_id": plan_id,
        "kind": "subscription_upgrade",
    }

    stripe_sdk.api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_sdk.api_key:
        raise RuntimeError("STRIPE_API_KEY not configured")

    price_id = _price_id_for(plan)
    if price_id:
        # Real subscription mode
        raw = await asyncio.to_thread(
            stripe_sdk.checkout.Session.create,
            mode="subscription",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=user_email,
            client_reference_id=user_id,
            metadata=metadata,
            subscription_data={"metadata": metadata},
            allow_promotion_codes=True,
        )
        sid = raw["id"] if isinstance(raw, dict) else raw.id
        url = raw["url"] if isinstance(raw, dict) else raw.url
        return _NormalizedSession(sid, url), plan

    # No Stripe Price ID configured for this plan. In production this must be a
    # hard error — the one-time payment fallback would charge users once while
    # the webhook applies a recurring plan they never subscribed to.
    if os.environ.get("ENVIRONMENT") == "production":
        raise RuntimeError(
            f"Stripe price ID not configured for plan '{plan_id}' "
            f"(missing env {plan.get('stripe_price_env')})"
        )

    # Fallback: one-time payment for dev/test
    raw = await asyncio.to_thread(
        stripe_sdk.checkout.Session.create,
        mode="payment",
        line_items=[{
            "price_data": {
                "currency": "usd",
                "product_data": {"name": f"Goodly {plan['name']} Plan"},
                "unit_amount": int(plan["price_usd"] * 100),
            },
            "quantity": 1,
        }],
        success_url=success_url,
        cancel_url=cancel_url,
        customer_email=user_email,
        client_reference_id=user_id,
        metadata=metadata,
    )
    sid = raw["id"] if isinstance(raw, dict) else raw.id
    url = raw["url"] if isinstance(raw, dict) else raw.url
    return _NormalizedSession(sid, url), plan
