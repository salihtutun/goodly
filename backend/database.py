"""Shared MongoDB database connection for Goodly API.

Lazy-initialized for serverless environments (Cloud Run).
The actual connection is managed by server.py which calls _init_connection().
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient

_client = None
_db = None


def _init_connection(client, db):
    """Called by server.py after it creates the MongoDB connection.
    Shares the same connection so all modules use one client."""
    global _client, _db
    _client = client
    _db = db


def _get_db():
    global _client, _db
    if _client is None:
        mongo_url = os.environ.get("MONGO_URL")
        if not mongo_url:
            raise RuntimeError("MONGO_URL not configured")
        _client = AsyncIOMotorClient(mongo_url)
        _db = _client[os.environ.get("DB_NAME", "goodly")]
    return _db


class _LazyDB:
    """Proxy that lazily resolves to the MongoDB database."""

    def __getattr__(self, name):
        return getattr(_get_db(), name)

    def __getitem__(self, key):
        return _get_db()[key]


db = _LazyDB()
