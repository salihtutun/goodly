"""Unit tests for auth.py — JWT authentication utilities."""
import os
import pytest
import jwt
from unittest.mock import patch, MagicMock
from datetime import datetime, timezone, timedelta

# Use AsyncMock from conftest (Python 3.7 compatible)
from conftest import AsyncMock

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    decode_token,
    extract_token,
    get_current_user_id,
    get_jwt_secret,
    JWT_ALGORITHM,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _set_env(**kwargs):
    """Set environment variables, clearing any existing ones first."""
    for k in kwargs:
        os.environ[k] = kwargs[k]


def _clear_env(*keys):
    """Remove specific env vars."""
    for k in keys:
        os.environ.pop(k, None)


# ---------------------------------------------------------------------------
# get_jwt_secret
# ---------------------------------------------------------------------------

def test_get_jwt_secret_configured():
    """Returns the secret when JWT_SECRET is set in the environment."""
    _set_env(JWT_SECRET="my-secret-key")
    try:
        assert get_jwt_secret() == "my-secret-key"
    finally:
        _clear_env("JWT_SECRET")


def test_get_jwt_secret_missing_raises():
    """Raises RuntimeError when JWT_SECRET is not configured."""
    _clear_env("JWT_SECRET")
    with pytest.raises(RuntimeError, match="JWT_SECRET is not configured"):
        get_jwt_secret()


# ---------------------------------------------------------------------------
# hash_password
# ---------------------------------------------------------------------------

def test_hash_password_returns_string():
    """hash_password returns a non-empty string."""
    result = hash_password("mypassword")
    assert isinstance(result, str)
    assert len(result) > 0


def test_hash_password_different_each_time():
    """Each call to hash_password produces a different hash (unique salt)."""
    h1 = hash_password("mypassword")
    h2 = hash_password("mypassword")
    assert h1 != h2


def test_hash_password_handles_special_chars():
    """hash_password works with special characters."""
    result = hash_password("p@ss!word#123")
    assert isinstance(result, str)
    assert result.startswith("$2b$") or result.startswith("$2a$")


# ---------------------------------------------------------------------------
# verify_password
# ---------------------------------------------------------------------------

def test_verify_password_correct():
    """verify_password returns True for the correct plaintext."""
    hashed = hash_password("secret123")
    assert verify_password("secret123", hashed) is True


def test_verify_password_incorrect():
    """verify_password returns False for an incorrect plaintext."""
    hashed = hash_password("secret123")
    assert verify_password("wrongpassword", hashed) is False


def test_verify_password_handles_corrupt_hash():
    """verify_password returns False when the hash is corrupt/malformed."""
    assert verify_password("anything", "not-a-valid-bcrypt-hash") is False


def test_verify_password_handles_empty_strings():
    """verify_password handles empty password and hash gracefully."""
    hashed = hash_password("")
    assert verify_password("", hashed) is True
    assert verify_password("x", hashed) is False


# ---------------------------------------------------------------------------
# create_access_token
# ---------------------------------------------------------------------------

def test_create_access_token_returns_string():
    """create_access_token returns a non-empty JWT string."""
    _set_env(JWT_SECRET="test-secret-key-that-is-32-bytes-long!")
    try:
        token = create_access_token("user-1", "test@example.com")
        assert isinstance(token, str)
        assert len(token) > 20
    finally:
        _clear_env("JWT_SECRET")


def test_create_access_token_contains_claims():
    """The token payload contains sub, email, type, and exp claims."""
    _set_env(JWT_SECRET="test-secret-key-that-is-32-bytes-long!")
    try:
        token = create_access_token("user-1", "test@example.com")
        payload = jwt.decode(token, "test-secret-key-that-is-32-bytes-long!", algorithms=[JWT_ALGORITHM])
        assert payload["sub"] == "user-1"
        assert payload["email"] == "test@example.com"
        assert payload["type"] == "access"
        assert "exp" in payload
    finally:
        _clear_env("JWT_SECRET")


def test_create_access_token_expiry_is_future():
    """The exp claim is set in the future (7 days)."""
    _set_env(JWT_SECRET="test-secret-key-that-is-32-bytes-long!")
    try:
        token = create_access_token("user-1", "test@example.com")
        payload = jwt.decode(token, "test-secret-key-that-is-32-bytes-long!", algorithms=[JWT_ALGORITHM])
        now = datetime.now(timezone.utc)
        exp = datetime.fromtimestamp(payload["exp"], tz=timezone.utc)
        assert exp > now
        assert (exp - now).days <= 7
    finally:
        _clear_env("JWT_SECRET")


# ---------------------------------------------------------------------------
# decode_token
# ---------------------------------------------------------------------------

def test_decode_token_returns_payload():
    """decode_token returns the correct payload dict."""
    _set_env(JWT_SECRET="test-secret-key-that-is-32-bytes-long!")
    try:
        token = create_access_token("user-1", "test@example.com")
        payload = decode_token(token)
        assert payload["sub"] == "user-1"
        assert payload["email"] == "test@example.com"
    finally:
        _clear_env("JWT_SECRET")


def test_decode_token_expired_raises():
    """decode_token raises ExpiredSignatureError for an expired token."""
    _set_env(JWT_SECRET="test-secret-key-that-is-32-bytes-long!")
    try:
        payload = {
            "sub": "user-1",
            "email": "test@example.com",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
            "type": "access",
        }
        token = jwt.encode(payload, "test-secret-key-that-is-32-bytes-long!", algorithm=JWT_ALGORITHM)
        with pytest.raises(jwt.ExpiredSignatureError):
            decode_token(token)
    finally:
        _clear_env("JWT_SECRET")


def test_decode_token_invalid_raises():
    """decode_token raises InvalidTokenError for a malformed token."""
    _set_env(JWT_SECRET="test-secret-key-that-is-32-bytes-long!")
    try:
        with pytest.raises(jwt.InvalidTokenError):
            decode_token("not.a.valid.token")
    finally:
        _clear_env("JWT_SECRET")


def test_decode_token_wrong_secret_raises():
    """decode_token raises an error when the secret doesn't match."""
    _set_env(JWT_SECRET="test-secret-key-that-is-32-bytes-long!")
    try:
        token = jwt.encode({"sub": "x"}, "wrong-secret", algorithm=JWT_ALGORITHM)
        with pytest.raises(jwt.InvalidSignatureError):
            decode_token(token)
    finally:
        _clear_env("JWT_SECRET")


# ---------------------------------------------------------------------------
# extract_token
# ---------------------------------------------------------------------------

class FakeRequest:
    """Minimal fake for FastAPI Request."""
    def __init__(self, cookies=None, headers=None):
        self.cookies = cookies or {}
        self.headers = headers or {}


def test_extract_token_from_cookie():
    """extract_token returns the token from the access_token cookie."""
    req = FakeRequest(cookies={"access_token": "cookie-token-value"})
    assert extract_token(req) == "cookie-token-value"


def test_extract_token_from_header():
    """extract_token returns the token from the Authorization header."""
    req = FakeRequest(headers={"Authorization": "Bearer header-token-value"})
    assert extract_token(req) == "header-token-value"


def test_extract_token_cookie_priority_over_header():
    """Cookie takes priority over Authorization header."""
    req = FakeRequest(
        cookies={"access_token": "cookie-token"},
        headers={"Authorization": "Bearer header-token"},
    )
    assert extract_token(req) == "cookie-token"


def test_extract_token_none():
    """extract_token returns None when no token is present."""
    req = FakeRequest()
    assert extract_token(req) is None


def test_extract_token_header_no_bearer():
    """extract_token returns None when Authorization header lacks Bearer prefix."""
    req = FakeRequest(headers={"Authorization": "Basic abc123"})
    assert extract_token(req) is None


# ---------------------------------------------------------------------------
# get_current_user_id
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_get_current_user_id_returns_sub():
    """get_current_user_id returns the user id from a valid token."""
    _set_env(JWT_SECRET="test-secret-key-that-is-32-bytes-long!")
    try:
        token = create_access_token("user-99", "u@test.com")
        req = FakeRequest(cookies={"access_token": token})
        user_id = await get_current_user_id(req)
        assert user_id == "user-99"
    finally:
        _clear_env("JWT_SECRET")


@pytest.mark.asyncio
async def test_get_current_user_id_no_token_raises_401():
    """Raises 401 when no token is provided."""
    req = FakeRequest()
    from fastapi import HTTPException
    with pytest.raises(HTTPException) as exc:
        await get_current_user_id(req)
    assert exc.value.status_code == 401
    assert "Not authenticated" in exc.value.detail


@pytest.mark.asyncio
async def test_get_current_user_id_expired_token_raises_401():
    """Raises 401 with 'Token expired' for an expired token."""
    _set_env(JWT_SECRET="test-secret-key-that-is-32-bytes-long!")
    try:
        payload = {
            "sub": "user-1",
            "email": "test@example.com",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
            "type": "access",
        }
        token = jwt.encode(payload, "test-secret-key-that-is-32-bytes-long!", algorithm=JWT_ALGORITHM)
        req = FakeRequest(cookies={"access_token": token})
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            await get_current_user_id(req)
        assert exc.value.status_code == 401
        assert "Token expired" in exc.value.detail
    finally:
        _clear_env("JWT_SECRET")


@pytest.mark.asyncio
async def test_get_current_user_id_invalid_token_raises_401():
    """Raises 401 with 'Invalid token' for a malformed token."""
    _set_env(JWT_SECRET="test-secret-key-that-is-32-bytes-long!")
    try:
        req = FakeRequest(cookies={"access_token": "garbage"})
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            await get_current_user_id(req)
        assert exc.value.status_code == 401
        assert "Invalid token" in exc.value.detail
    finally:
        _clear_env("JWT_SECRET")


@pytest.mark.asyncio
async def test_get_current_user_id_wrong_token_type_raises_401():
    """Raises 401 when token type is not 'access'."""
    _set_env(JWT_SECRET="test-secret-key-that-is-32-bytes-long!")
    try:
        payload = {
            "sub": "user-1",
            "email": "test@example.com",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "type": "refresh",
        }
        token = jwt.encode(payload, "test-secret-key-that-is-32-bytes-long!", algorithm=JWT_ALGORITHM)
        req = FakeRequest(cookies={"access_token": token})
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            await get_current_user_id(req)
        assert exc.value.status_code == 401
        assert "Invalid token type" in exc.value.detail
    finally:
        _clear_env("JWT_SECRET")


@pytest.mark.asyncio
async def test_get_current_user_id_missing_sub_raises_401():
    """Raises 401 when the token payload has no 'sub' claim."""
    _set_env(JWT_SECRET="test-secret-key-that-is-32-bytes-long!")
    try:
        payload = {
            "email": "test@example.com",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "type": "access",
        }
        token = jwt.encode(payload, "test-secret-key-that-is-32-bytes-long!", algorithm=JWT_ALGORITHM)
        req = FakeRequest(cookies={"access_token": token})
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            await get_current_user_id(req)
        assert exc.value.status_code == 401
        assert "Invalid token payload" in exc.value.detail
    finally:
        _clear_env("JWT_SECRET")
