"""Unit tests for sentry_integration.py — init_sentry, capture_exception, set_user_context."""
import pytest
from unittest.mock import patch, MagicMock


class TestInitSentry:
    def test_no_dsn_returns_false(self):
        with patch("os.environ.get", return_value=""):
            from sentry_integration import init_sentry
            result = init_sentry()
            assert result is False

    def test_import_error_returns_false(self):
        with patch("os.environ.get", return_value="https://fake@sentry.io/123"):
            import sentry_integration as si
            si._sentry_initialized = False
            # sentry_sdk is imported lazily inside init_sentry
            # Patch the builtins __import__ to simulate ImportError
            with patch("builtins.__import__", side_effect=ImportError):
                result = si.init_sentry()
                assert result is False

    def test_init_exception_returns_false(self):
        with patch("os.environ.get", return_value="https://fake@sentry.io/123"):
            import sentry_integration as si
            si._sentry_initialized = False
            # Allow sentry_sdk import but make init fail
            def mock_import(name, *args, **kwargs):
                if name == "sentry_sdk":
                    m = MagicMock()
                    m.init.side_effect = Exception("init failed")
                    return m
                return __import__(name, *args, **kwargs)
            with patch("builtins.__import__", side_effect=mock_import):
                result = si.init_sentry()
                assert result is False

    def test_successful_init(self):
        with patch("os.environ.get", side_effect=lambda k, d=None: {
            "SENTRY_DSN": "https://fake@sentry.io/123",
            "SENTRY_ENVIRONMENT": "staging",
            "SENTRY_RELEASE": "goodly@2.0.0",
            "SENTRY_TRACES_SAMPLE_RATE": "0.5",
            "SENTRY_PROFILES_SAMPLE_RATE": "0.1",
        }.get(k, d)):
            import sentry_integration as si
            si._sentry_initialized = False
            mock_sdk = MagicMock()
            mock_sdk.init = MagicMock()
            def mock_import(name, *args, **kwargs):
                if name == "sentry_sdk":
                    return mock_sdk
                if name == "sentry_sdk.integrations.fastapi":
                    return MagicMock()
                if name == "sentry_sdk.integrations.asyncio":
                    return MagicMock()
                return __import__(name, *args, **kwargs)
            with patch("builtins.__import__", side_effect=mock_import):
                result = si.init_sentry()
                assert result is True
                mock_sdk.init.assert_called_once()


class TestCaptureException:
    def test_not_initialized_returns_early(self):
        import sentry_integration as si
        si._sentry_initialized = False
        si.capture_exception(Exception("test"))
        # Should not raise

    def test_handles_sentry_failure(self):
        import sentry_integration as si
        si._sentry_initialized = True
        # sentry_sdk not installed, so import will fail inside capture_exception
        si.capture_exception(Exception("test"))
        # Should not raise


class TestSetUserContext:
    def test_not_initialized_returns_early(self):
        import sentry_integration as si
        si._sentry_initialized = False
        si.set_user_context(user_id="u1", email="a@b.com", plan="pro")
        # Should not raise

    def test_handles_sentry_failure(self):
        import sentry_integration as si
        si._sentry_initialized = True
        # sentry_sdk not installed, so import will fail inside set_user_context
        si.set_user_context(user_id="u1")
        # Should not raise
