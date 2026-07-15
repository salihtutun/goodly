"""Feature flags for Goodly API.

Simple env-var-based feature flags. No database dependency.
For production, swap to a DB-backed or LaunchDarkly-style system.

Usage:
    from features import is_enabled

    if is_enabled("new_dashboard"):
        return new_dashboard_data()
    return legacy_dashboard_data()
"""
import os
from typing import Dict, Optional

# ── Flag definitions ──────────────────────────────────
# Each flag has: default (bool), description, env_var override
_FLAGS: Dict[str, dict] = {
    "ai_visibility": {
        "default": True,
        "description": "AI assistant visibility checks (ChatGPT, Claude, etc.)",
        "env": "FEATURE_AI_VISIBILITY",
    },
    "social_audit": {
        "default": True,
        "description": "Social media audit (Instagram, TikTok, YouTube)",
        "env": "FEATURE_SOCIAL_AUDIT",
    },
    "gbp_audit": {
        "default": True,
        "description": "Google Business Profile audit",
        "env": "FEATURE_GBP_AUDIT",
    },
    "competitor_comparison": {
        "default": True,
        "description": "Head-to-head competitor SEO comparison",
        "env": "FEATURE_COMPETITOR_COMPARISON",
    },
    "serp_tracking": {
        "default": True,
        "description": "SERP rank tracking",
        "env": "FEATURE_SERP_TRACKING",
    },
    "scheduled_audits": {
        "default": True,
        "description": "Automated scheduled re-audits",
        "env": "FEATURE_SCHEDULED_AUDITS",
    },
    "pdf_export": {
        "default": True,
        "description": "PDF report export",
        "env": "FEATURE_PDF_EXPORT",
    },
    "concierge": {
        "default": True,
        "description": "Concierge done-for-you service",
        "env": "FEATURE_CONCIERGE",
    },
    "referrals": {
        "default": True,
        "description": "Referral program",
        "env": "FEATURE_REFERRALS",
    },
    "google_auth": {
        "default": True,
        "description": "Sign in with Google",
        "env": "FEATURE_GOOGLE_AUTH",
    },
    "achievements": {
        "default": True,
        "description": "Gamification achievements and badges",
        "env": "FEATURE_ACHIEVEMENTS",
    },
    "public_audit": {
        "default": True,
        "description": "No-login public audit at /audit",
        "env": "FEATURE_PUBLIC_AUDIT",
    },
    "support_widget": {
        "default": True,
        "description": "In-app support contact widget",
        "env": "FEATURE_SUPPORT_WIDGET",
    },
    "new_dashboard": {
        "default": False,
        "description": "Next-gen dashboard (in development)",
        "env": "FEATURE_NEW_DASHBOARD",
    },
    "revenue_impact": {
        "default": False,
        "description": "Revenue impact estimates in audit results (beta)",
        "env": "FEATURE_REVENUE_IMPACT",
    },
}


def is_enabled(flag_name: str) -> bool:
    """Check if a feature flag is enabled.

    Resolution order: env var > flag default.
    Env vars: FEATURE_<NAME> (uppercase, underscores).
    Set to '0', 'false', 'no', or 'off' to disable.
    """
    flag = _FLAGS.get(flag_name)
    if flag is None:
        return False  # Unknown flags are off

    env_var = flag.get("env", "")
    if env_var:
        env_val = os.environ.get(env_var, "").strip().lower()
        if env_val in ("0", "false", "no", "off"):
            return False
        if env_val in ("1", "true", "yes", "on"):
            return True

    return flag["default"]


def get_all_flags() -> Dict[str, bool]:
    """Return all flags and their current state (for admin/debug)."""
    return {name: is_enabled(name) for name in _FLAGS}


def get_flag_info(name: str) -> Optional[dict]:
    """Return flag metadata (description, default, current state)."""
    flag = _FLAGS.get(name)
    if flag is None:
        return None
    return {
        "name": name,
        "description": flag["description"],
        "default": flag["default"],
        "enabled": is_enabled(name),
        "env_var": flag.get("env"),
    }
