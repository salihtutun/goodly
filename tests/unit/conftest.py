"""Shared fixtures for unit tests. Compatible with Python 3.7+."""
import os
import asyncio
import pytest
from unittest.mock import MagicMock


# ---------------------------------------------------------------------------
# AsyncMock backport for Python < 3.8
# ---------------------------------------------------------------------------
class AsyncMock(MagicMock):
    """A MagicMock subclass that works with async/await."""

    async def __call__(self, *args, **kwargs):
        return super().__call__(*args, **kwargs)


@pytest.fixture(autouse=True)
def clean_env():
    """Remove sensitive env vars before each test to ensure isolation."""
    keys_to_remove = [
        "JWT_SECRET", "GEMINI_API_KEY", "RESEND_API_KEY",
        "STRIPE_API_KEY", "STRIPE_PRICE_ID_CONCIERGE", "SERPAPI_KEY",
        "SCHEDULER_ENABLED", "SENDER_EMAIL",
    ]
    saved = {}
    for k in keys_to_remove:
        if k in os.environ:
            saved[k] = os.environ.pop(k)
    # Ensure MONGO_URL is set so database.db lazy proxy doesn't fail
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    yield
    for k, v in saved.items():
        os.environ[k] = v


@pytest.fixture
def mock_db():
    """Return a mock MongoDB database with common collections."""
    db = MagicMock()
    db.users = AsyncMock()
    db.audits = AsyncMock()
    db.projects = AsyncMock()
    db.scheduled_runs = AsyncMock()
    return db
