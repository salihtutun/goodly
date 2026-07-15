"""JWT authentication utilities with refresh token support.

Access tokens: 24 hours (short-lived, sent as HttpOnly cookie)
Refresh tokens: 30 days (stored in DB, used to get new access tokens)
"""

import logging
import os
import uuid
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from fastapi import HTTPException, Request, Response
from typing import Optional

JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60 * 24       # 24 hours
REFRESH_TOKEN_DAYS = 30              # 30 days


def get_jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET")
    if not secret:
        raise RuntimeError("JWT_SECRET is not configured")
    return secret


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception as e:
        logging.getLogger("auth").warning("Password verification error: %s", type(e).__name__)
        return False


def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES),
        "type": "access",
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    """Create a long-lived refresh token (stored in DB, not in cookie)."""
    return str(uuid.uuid4()) + "." + str(uuid.uuid4())


def decode_token(token: str) -> dict:
    return jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])


def extract_token(request: Request) -> Optional[str]:
    token = request.cookies.get("access_token")
    if token:
        return token
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
    return None


async def get_current_user_id(request: Request) -> str:
    """Dependency that returns the authenticated user id."""
    token = extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(token)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    return user_id


def set_auth_cookie(response: Response, token: str):
    is_production = os.environ.get("ENVIRONMENT", "development") == "production"
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=is_production,
        samesite="none" if is_production else "lax",
        max_age=ACCESS_TOKEN_MINUTES * 60,
        path="/",
    )


async def store_refresh_token(db, user_id: str, token: str) -> None:
    """Store a refresh token in the database."""
    expires_at = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_DAYS)
    await db.refresh_tokens.insert_one({
        "token": token,
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": expires_at.isoformat(),
    })


async def consume_refresh_token(db, token: str) -> Optional[str]:
    """Validate and consume a refresh token. Returns user_id or None."""
    doc = await db.refresh_tokens.find_one({"token": token})
    if not doc:
        return None
    try:
        expires_at = datetime.fromisoformat(doc["expires_at"].replace("Z", "+00:00"))
        if datetime.now(timezone.utc) > expires_at:
            await db.refresh_tokens.delete_one({"token": token})
            return None
    except Exception:
        pass
    await db.refresh_tokens.delete_one({"token": token})
    return doc["user_id"]


async def revoke_user_refresh_tokens(db, user_id: str) -> None:
    """Revoke all refresh tokens for a user (e.g., on password change)."""
    await db.refresh_tokens.delete_many({"user_id": user_id})
