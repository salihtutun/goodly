"""Unit tests for billing.py — plans, limits, and Stripe helpers."""
import os
import pytest
from unittest.mock import patch, MagicMock

from conftest import AsyncMock

from billing import (
    PLANS,
    get_plan,
    month_key,
    _price_id_for,
    create_subscription_checkout,
    _NormalizedSession,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _set_env(**kwargs):
    for k, v in kwargs.items():
        os.environ[k] = v


def _clear_env(*keys):
    for k in keys:
        os.environ.pop(k, None)


# ---------------------------------------------------------------------------
# get_plan
# ---------------------------------------------------------------------------

def test_get_plan_free():
    """get_plan('free') returns the free plan dict."""
    plan = get_plan("free")
    assert plan["id"] == "free"
    assert plan["name"] == "Self-serve"
    assert plan["price_usd"] == 0.0
    assert plan["audit_limit"] == 5
    assert plan["project_limit"] == 2


def test_get_plan_concierge():
    """get_plan('concierge') returns the concierge plan dict."""
    plan = get_plan("concierge")
    assert plan["id"] == "concierge"
    assert plan["name"] == "Concierge"
    assert plan["price_usd"] == 1000.0
    assert plan["audit_limit"] is None
    assert plan["project_limit"] == 25


def test_get_plan_unknown_returns_free():
    """get_plan with an unknown plan_id falls back to the free plan."""
    plan = get_plan("nonexistent")
    assert plan["id"] == "free"


def test_get_plan_none_returns_free():
    """get_plan(None) returns the free plan."""
    plan = get_plan(None)
    assert plan["id"] == "free"


def test_get_plan_empty_string_returns_free():
    """get_plan('') returns the free plan (falsy string)."""
    plan = get_plan("")
    assert plan["id"] == "free"


# ---------------------------------------------------------------------------
# month_key
# ---------------------------------------------------------------------------

def test_month_key_format():
    """month_key returns a YYYY-MM formatted string."""
    from datetime import datetime, timezone
    key = month_key(datetime(2025, 3, 15, tzinfo=timezone.utc))
    assert key == "2025-03"


def test_month_key_defaults_to_now():
    """month_key with no argument returns the current month."""
    key = month_key()
    assert isinstance(key, str)
    assert len(key) == 7
    assert key[4] == "-"


def test_month_key_january():
    """month_key pads single-digit months with zero."""
    from datetime import datetime, timezone
    key = month_key(datetime(2025, 1, 1, tzinfo=timezone.utc))
    assert key == "2025-01"


# ---------------------------------------------------------------------------
# _price_id_for
# ---------------------------------------------------------------------------

def test_price_id_for_with_env():
    """_price_id_for returns the env var value when set."""
    _set_env(STRIPE_PRICE_ID_CONCIERGE="price_abc123")
    try:
        plan = PLANS["concierge"]
        assert _price_id_for(plan) == "price_abc123"
    finally:
        _clear_env("STRIPE_PRICE_ID_CONCIERGE")


def test_price_id_for_without_env():
    """_price_id_for returns None when the env var is not set."""
    _clear_env("STRIPE_PRICE_ID_CONCIERGE")
    plan = PLANS["concierge"]
    assert _price_id_for(plan) is None


def test_price_id_for_no_stripe_price_env():
    """_price_id_for returns None when the plan has no stripe_price_env key."""
    plan = PLANS["free"]
    assert _price_id_for(plan) is None


def test_price_id_for_empty_env_value():
    """_price_id_for returns empty string when the env var is whitespace-only."""
    _set_env(STRIPE_PRICE_ID_CONCIERGE="   ")
    try:
        plan = PLANS["concierge"]
        assert _price_id_for(plan) == ""
    finally:
        _clear_env("STRIPE_PRICE_ID_CONCIERGE")


# ---------------------------------------------------------------------------
# PLANS structure
# ---------------------------------------------------------------------------

def test_plans_have_required_fields():
    """Every plan has id, name, price_usd, audit_limit, project_limit, features, perks."""
    required = {"id", "name", "price_usd", "audit_limit", "project_limit", "features", "perks"}
    for plan_id, plan in PLANS.items():
        assert required.issubset(plan.keys()), f"{plan_id} missing fields: {required - set(plan.keys())}"


def test_free_plan_limits():
    """Free plan has finite audit and project limits."""
    free = PLANS["free"]
    assert free["audit_limit"] == 5
    assert free["project_limit"] == 2
    assert free["perks"]["pdf_export"] is False
    assert free["perks"]["scheduled_audits"] is False
    assert free["perks"]["serp_tracking"] is False


def test_concierge_plan_unlimited():
    """Concierge plan has unlimited audits (None) and all perks enabled."""
    concierge = PLANS["concierge"]
    assert concierge["audit_limit"] is None
    assert concierge["project_limit"] == 25
    for perk, enabled in concierge["perks"].items():
        assert enabled is True, f"perk {perk} should be True"


# ---------------------------------------------------------------------------
# create_subscription_checkout
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_create_checkout_free_plan_raises():
    """create_subscription_checkout raises ValueError for the free plan."""
    with pytest.raises(ValueError, match="Invalid plan for checkout"):
        await create_subscription_checkout(
            host_url="https://searchgoodly.com",
            plan_id="free",
            user_id="u1",
            user_email="u@test.com",
            origin_url="https://searchgoodly.com",
        )


@pytest.mark.asyncio
async def test_create_checkout_unknown_plan_raises():
    """create_subscription_checkout raises ValueError for an unknown plan."""
    with pytest.raises(ValueError, match="Invalid plan for checkout"):
        await create_subscription_checkout(
            host_url="https://searchgoodly.com",
            plan_id="nonexistent",
            user_id="u1",
            user_email="u@test.com",
            origin_url="https://searchgoodly.com",
        )


@pytest.mark.asyncio
async def test_create_checkout_missing_stripe_key_raises():
    """create_subscription_checkout raises RuntimeError when STRIPE_API_KEY is missing."""
    _clear_env("STRIPE_API_KEY")
    with pytest.raises(RuntimeError, match="STRIPE_API_KEY not configured"):
        await create_subscription_checkout(
            host_url="https://searchgoodly.com",
            plan_id="concierge",
            user_id="u1",
            user_email="u@test.com",
            origin_url="https://searchgoodly.com",
        )


@pytest.mark.asyncio
async def test_create_checkout_payment_mode():
    """When no price_id env is set, falls back to one-time payment mode."""
    _set_env(STRIPE_API_KEY="sk_test_123")
    _clear_env("STRIPE_PRICE_ID_CONCIERGE")
    try:
        mock_session = MagicMock()
        mock_session.id = "cs_test_123"
        mock_session.url = "https://checkout.stripe.com/pay/cs_test_123"

        with patch("billing.stripe_sdk") as mock_stripe:
            # Python 3.7: monkey-patch asyncio.to_thread on the billing module
            import billing
            saved = getattr(billing.asyncio, 'to_thread', None)
            billing.asyncio.to_thread = AsyncMock(return_value=mock_session)
            try:
                session, plan = await create_subscription_checkout(
                    host_url="https://searchgoodly.com",
                    plan_id="concierge",
                    user_id="u1",
                    user_email="u@test.com",
                    origin_url="https://searchgoodly.com",
                )
                assert session.session_id == "cs_test_123"
                assert session.url == "https://checkout.stripe.com/pay/cs_test_123"
                assert plan["id"] == "concierge"
            finally:
                if saved is not None:
                    billing.asyncio.to_thread = saved
                else:
                    del billing.asyncio.to_thread
    finally:
        _clear_env("STRIPE_API_KEY")


@pytest.mark.asyncio
async def test_create_checkout_subscription_mode():
    """When price_id env is set, uses subscription mode."""
    _set_env(STRIPE_API_KEY="sk_test_123", STRIPE_PRICE_ID_CONCIERGE="price_xyz")
    try:
        mock_session = MagicMock()
        mock_session.id = "cs_sub_456"
        mock_session.url = "https://checkout.stripe.com/sub/cs_sub_456"

        with patch("billing.stripe_sdk") as mock_stripe:
            import billing
            saved = getattr(billing.asyncio, 'to_thread', None)
            billing.asyncio.to_thread = AsyncMock(return_value=mock_session)
            try:
                session, plan = await create_subscription_checkout(
                    host_url="https://searchgoodly.com",
                    plan_id="concierge",
                    user_id="u1",
                    user_email="u@test.com",
                    origin_url="https://searchgoodly.com",
                )
                assert session.session_id == "cs_sub_456"
                assert plan["id"] == "concierge"
            finally:
                if saved is not None:
                    billing.asyncio.to_thread = saved
                else:
                    del billing.asyncio.to_thread
    finally:
        _clear_env("STRIPE_API_KEY", "STRIPE_PRICE_ID_CONCIERGE")


@pytest.mark.asyncio
async def test_create_checkout_metadata():
    """Checkout session includes correct metadata (verified via URL construction)."""
    _set_env(STRIPE_API_KEY="sk_test_123")
    _clear_env("STRIPE_PRICE_ID_CONCIERGE")
    try:
        mock_session = MagicMock()
        mock_session.id = "cs_meta"
        mock_session.url = "https://checkout.stripe.com/pay/cs_meta"

        with patch("billing.stripe_sdk") as mock_stripe:
            import billing
            saved = getattr(billing.asyncio, 'to_thread', None)
            billing.asyncio.to_thread = AsyncMock(return_value=mock_session)
            try:
                session, plan = await create_subscription_checkout(
                    host_url="https://searchgoodly.com",
                    plan_id="concierge",
                    user_id="user-42",
                    user_email="user42@test.com",
                    origin_url="https://searchgoodly.com",
                )
                assert session.session_id == "cs_meta"
                assert plan["id"] == "concierge"
            finally:
                if saved is not None:
                    billing.asyncio.to_thread = saved
                else:
                    del billing.asyncio.to_thread
    finally:
        _clear_env("STRIPE_API_KEY")


@pytest.mark.asyncio
async def test_create_checkout_success_cancel_urls():
    """Success and cancel URLs are constructed correctly."""
    _set_env(STRIPE_API_KEY="sk_test_123")
    _clear_env("STRIPE_PRICE_ID_CONCIERGE")
    try:
        mock_session = MagicMock()
        mock_session.id = "cs_urls"
        mock_session.url = "https://checkout.stripe.com/pay/cs_urls"

        with patch("billing.stripe_sdk") as mock_stripe:
            import billing
            saved = getattr(billing.asyncio, 'to_thread', None)
            billing.asyncio.to_thread = AsyncMock(return_value=mock_session)
            try:
                session, plan = await create_subscription_checkout(
                    host_url="https://searchgoodly.com",
                    plan_id="concierge",
                    user_id="u1",
                    user_email="u@test.com",
                    origin_url="https://app.searchgoodly.com/",
                )
                assert session.session_id == "cs_urls"
                assert plan["id"] == "concierge"
            finally:
                if saved is not None:
                    billing.asyncio.to_thread = saved
                else:
                    del billing.asyncio.to_thread
    finally:
        _clear_env("STRIPE_API_KEY")


def test_normalized_session():
    """_NormalizedSession stores session_id and url."""
    ns = _NormalizedSession("sess_1", "https://example.com")
    assert ns.session_id == "sess_1"
    assert ns.url == "https://example.com"
