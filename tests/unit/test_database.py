"""Unit tests for database.py — _LazyDB proxy, _init_connection, _get_db."""
import pytest
from unittest.mock import patch, MagicMock


class TestLazyDB:
    def test_getattr_delegates(self):
        with patch("database._get_db") as mock_get:
            from database import _LazyDB
            mock_db = MagicMock()
            mock_db.users = "users_collection"
            mock_get.return_value = mock_db
            lazy = _LazyDB()
            assert lazy.users == "users_collection"

    def test_getitem_delegates(self):
        with patch("database._get_db") as mock_get:
            from database import _LazyDB
            mock_db = MagicMock()
            mock_db.__getitem__ = MagicMock(return_value="coll")
            mock_get.return_value = mock_db
            lazy = _LazyDB()
            assert lazy["users"] == "coll"


class TestInitConnection:
    def test_sets_globals(self):
        import database
        database._init_connection("fake_client", "fake_db")
        assert database._client == "fake_client"
        assert database._db == "fake_db"
        # Reset for other tests
        database._client = None
        database._db = None


class TestGetDb:
    def test_raises_without_mongo_url(self):
        import database
        database._client = None
        database._db = None
        with patch("os.environ.get", return_value=None):
            with pytest.raises(RuntimeError, match="MONGO_URL not configured"):
                database._get_db()

    def test_creates_client_when_configured(self):
        import database
        database._client = None
        database._db = None
        with patch("os.environ.get", side_effect=lambda k, d=None: "mongodb://localhost:27017" if k == "MONGO_URL" else (d or "goodly")):
            with patch("database.AsyncIOMotorClient") as mock_client:
                mock_client.return_value = MagicMock()
                result = database._get_db()
                assert result is not None
                mock_client.assert_called_once()
        database._client = None
        database._db = None

    def test_returns_cached_db(self):
        import database
        database._client = "cached_client"
        database._db = "cached_db"
        result = database._get_db()
        assert result == "cached_db"
        database._client = None
        database._db = None
