"""Plans, limits, and Stripe checkout helpers."""
import os
from datetime import datetime, timezone
from typing import Dict, Optional

from emergentintegrations.payments.stripe.checkout import (
    StripeCheckout,
    CheckoutSessionRequest,
)

# Plan definitions (server-authoritative — never trust frontend prices)
PLANS: Dict[str, dict] = {
    "free": {
        "id": "free",
        "name": "Self-serve",
        "price_usd": 0.0,
        "audit_limit": 3,         # per month
        "project_limit": 1,
        "features": [
            "3 audits per month",
            "1 saved project",
            "AI-generated action plan",
            "Try the tool — no card needed",
        ],
        "perks": {
            "pdf_export": False,
            "scheduled_audits": False,
            "serp_tracking": False,
            "competitor_analysis": False,
            "done_for_you": False,
        },
    },
    "concierge": {
        "id": "concierge",
        "name": "Concierge",
        "price_usd": 1000.0,
        "audit_limit": None,      # unlimited
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
        },
    },
}


def get_plan(plan_id: Optional[str]) -> dict:
    return PLANS.get(plan_id or "free", PLANS["free"])


def month_key(dt: Optional[datetime] = None) -> str:
    d = dt or datetime.now(timezone.utc)
    return d.strftime("%Y-%m")


def make_stripe(host_url: str) -> StripeCheckout:
    api_key = os.environ.get("STRIPE_API_KEY")
    if not api_key:
        raise RuntimeError("STRIPE_API_KEY not configured")
    webhook_url = f"{host_url.rstrip('/')}/api/webhook/stripe"
    return StripeCheckout(api_key=api_key, webhook_url=webhook_url)


async def create_subscription_checkout(
    *,
    host_url: str,
    plan_id: str,
    user_id: str,
    user_email: str,
    origin_url: str,
):
    plan = PLANS.get(plan_id)
    if not plan or plan_id == "free":
        raise ValueError("Invalid plan for checkout")

    stripe = make_stripe(host_url)
    success_url = f"{origin_url.rstrip('/')}/app/billing/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url.rstrip('/')}/app/billing?cancelled=1"

    req = CheckoutSessionRequest(
        amount=float(plan["price_usd"]),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user_id,
            "user_email": user_email,
            "plan_id": plan_id,
            "kind": "subscription_upgrade",
        },
    )
    session = await stripe.create_checkout_session(req)
    return session, plan
