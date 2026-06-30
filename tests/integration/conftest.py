"""Integration test fixtures - async mongomock wrapper with rate-limit bypass."""
import os, sys, pytest, asyncio
from unittest.mock import patch, MagicMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))

os.environ.setdefault("JWT_SECRET", "test-jwt-secret-for-integration-tests-32bytes!")
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
os.environ.setdefault("GEMINI_API_KEY", "test-gemini-key")
os.environ.setdefault("STRIPE_API_KEY", "test-stripe-key")
os.environ.setdefault("STRIPE_WEBHOOK_SECRET", "test-webhook-secret")
os.environ.setdefault("RESEND_API_KEY", "test-resend-key")
os.environ.setdefault("SENDER_EMAIL", "test@goodly.app")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ.setdefault("SCHEDULER_ENABLED", "false")
os.environ.setdefault("ADMIN_EMAIL", "admin@goodly.app")
os.environ.setdefault("ADMIN_PASSWORD", "admin-secret-123")
os.environ.setdefault("DEMO_PASSWORD", "demo1234")

def _future(result=None):
    f = asyncio.Future()
    f.set_result(result)
    return f

def _make_async_coll(coll):
    """Wrap a mongomock collection to return awaitables."""
    class AsyncColl:
        def __init__(self, c):
            self._c = c
        def __getattr__(self, name):
            orig = getattr(self._c, name)
            if callable(orig):
                def wrapper(*a, **kw):
                    result = orig(*a, **kw)
                    if hasattr(result, 'sort'):
                        class AsyncCursor:
                            def __init__(self, cursor):
                                self._cursor = cursor
                            def sort(self, *a, **kw):
                                self._cursor = self._cursor.sort(*a, **kw)
                                return self
                            def limit(self, n):
                                self._cursor = self._cursor.limit(n)
                                return self
                            def to_list(self, n=None):
                                if n:
                                    return _future(list(self._cursor.limit(n)))
                                return _future(list(self._cursor))
                        return AsyncCursor(result)
                    return _future(result)
                return wrapper
            return orig
    return AsyncColl(coll)


class AsyncDB:
    """Wraps a mongomock database so all collection access returns async wrappers."""
    def __init__(self, db):
        self._db = db
        self._wrapped = {}

    def _wrap_coll(self, name):
        """Get or create an async wrapper for a collection."""
        if name not in self._wrapped:
            # Access the underlying collection (mongomock auto-creates if needed)
            coll = self._db[name]
            self._wrapped[name] = _make_async_coll(coll)
        return self._wrapped[name]

    def __getattr__(self, name):
        if name.startswith('_'):
            raise AttributeError(name)
        # Special methods
        if name in ('command', 'list_collection_names', 'drop_collection', 'create_collection'):
            orig = getattr(self._db, name)
            if callable(orig):
                def wrapper(*a, **kw):
                    result = orig(*a, **kw)
                    return _future(result)
                return wrapper
            return orig
        return self._wrap_coll(name)

    def __getitem__(self, key):
        return self._wrap_coll(key)


from mongomock import MongoClient as MockMongoClient
mock_client = MockMongoClient()
_raw_db = mock_client["goodly_test"]
mock_db = AsyncDB(_raw_db)

with patch("motor.motor_asyncio.AsyncIOMotorClient", return_value=mock_client):
    import server as server_mod
    from server import app

server_mod._client = mock_client
server_mod._db = mock_db
server_mod._get_db = lambda: mock_db
server_mod.db = mock_db

# Disable rate limiting for tests
server_mod.limiter.enabled = False

from fastapi.testclient import TestClient


@pytest.fixture(autouse=True)
def setup():
    """Reset DB state and seed admin user before each test."""
    for coll in list(_raw_db.list_collection_names()):
        _raw_db.drop_collection(coll)
    # Clear wrapper cache so new collections get re-wrapped
    mock_db._wrapped.clear()
    from auth import hash_password
    _raw_db.users.insert_one({
        "id": "admin-1", "email": "admin@goodly.app",
        "password_hash": hash_password("admin-secret-123"),
        "name": "Admin", "role": "admin", "plan": "concierge",
        "onboarded": True, "email_verified": True,
        "created_at": "2026-01-01T00:00:00",
    })
    yield


@pytest.fixture
def client():
    """FastAPI TestClient."""
    return TestClient(app)
