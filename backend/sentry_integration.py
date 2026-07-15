"""
Sentry error tracking integration for Goodly backend.
Initialize with init_sentry() at app startup.
"""
import os
import logging
from version import VERSION

logger = logging.getLogger("goodly.sentry")

_sentry_initialized = False


def init_sentry():
    """Initialize Sentry SDK if SENTRY_DSN is configured."""
    global _sentry_initialized
    dsn = os.environ.get("SENTRY_DSN", "")
    if not dsn:
        logger.info("SENTRY_DSN not set — Sentry disabled")
        return False

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.asyncio import AsyncioIntegration

        sentry_sdk.init(
            dsn=dsn,
            environment=os.environ.get("SENTRY_ENVIRONMENT", "production"),
            release=os.environ.get("SENTRY_RELEASE", f"goodly@{VERSION}"),
            traces_sample_rate=float(os.environ.get("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
            profiles_sample_rate=float(os.environ.get("SENTRY_PROFILES_SAMPLE_RATE", "0.05")),
            integrations=[
                FastApiIntegration(transaction_style="endpoint"),
                AsyncioIntegration(),
            ],
            _experiments={
                "continuous_profiling_auto_start": True,
            },
        )
        _sentry_initialized = True
        logger.info("Sentry initialized — environment=%s", os.environ.get("SENTRY_ENVIRONMENT", "production"))
        return True
    except ImportError:
        logger.warning("sentry-sdk not installed — Sentry disabled")
        return False
    except Exception as e:
        logger.error("Sentry init failed: %s", e)
        return False


def capture_exception(error: Exception, extra: dict = None):
    """Capture an exception in Sentry if initialized."""
    if not _sentry_initialized:
        return
    try:
        import sentry_sdk
        with sentry_sdk.push_scope() as scope:
            if extra:
                for k, v in extra.items():
                    scope.set_extra(k, v)
            sentry_sdk.capture_exception(error)
    except Exception as e:
        logger.debug("Sentry capture_exception failed: %s", e)


def set_user_context(user_id: str = None, email: str = None, plan: str = None):
    """Set user context for Sentry error tracking."""
    if not _sentry_initialized:
        return
    try:
        import sentry_sdk
        sentry_sdk.set_user({
            "id": user_id,
            "email": email,
            "plan": plan,
        })
    except Exception:
        pass  # Sentry is non-critical — don't crash the app if it fails
