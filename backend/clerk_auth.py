"""Local account authentication with signed JWT bearer tokens.

The frontend retains its existing sign-in/sign-up screens and Clerk-compatible
provider interface, while local accounts are stored in MongoDB. Tokens are
signed server-side and every protected API request must present a valid token.
"""
from __future__ import annotations

import hashlib
import hmac
import os
import secrets
import uuid
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, HTTPException, Request, status
from pymongo.errors import DuplicateKeyError
from pydantic import BaseModel, EmailStr, Field

from lib.db import db

clerk_router = APIRouter(prefix="/api")
JWT_ALGORITHM = "HS256"
JWT_SECRET = os.environ.get("JWT_SECRET_KEY", "")
if not JWT_SECRET or JWT_SECRET == "replace-with-a-long-random-secret":
    if os.environ.get("APP_ENV", "development").lower() == "production":
        raise RuntimeError("JWT_SECRET_KEY must be configured with a strong random value in production.")
    # Stable local-only fallback so development sessions survive a backend restart.
    JWT_SECRET = "local-development-only-do-not-use-in-production-change-this-value"
TOKEN_TTL_HOURS = int(os.environ.get("TOKEN_TTL_HOURS", "24"))


class RegisterRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


def _hash_password(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return f"pbkdf2_sha256${salt.hex()}${digest.hex()}"


def _verify_password(password: str, encoded: str) -> bool:
    try:
        algorithm, salt_hex, expected = encoded.split("$", 2)
        if algorithm != "pbkdf2_sha256":
            return False
        actual = _hash_password(password, bytes.fromhex(salt_hex)).split("$", 2)[2]
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def _issue_token(user_id: str, email: str, name: str) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user_id,
        "email": email,
        "name": name,
        "iat": now,
        "exp": now + timedelta(hours=TOKEN_TTL_HOURS),
        "iss": "interview-coach",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def _auth_response(user: dict) -> dict:
    token = _issue_token(user["user_id"], user["email"], user["name"])
    return {
        "token": token,
        "user": {
            "id": user["user_id"],
            "name": user["name"],
            "email": user["email"],
        },
    }


@clerk_router.get("/clerk/config")
def clerk_config():
    return {"enabled": False, "publishable_key": "", "proxy_url": "", "local_mode": True}


@clerk_router.post("/auth/register")
async def register(body: RegisterRequest):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    user = {
        "user_id": f"user_{uuid.uuid4().hex}",
        "email": email,
        "name": body.name.strip(),
        "password_hash": _hash_password(body.password),
        "picture": None,
        "onboarding_completed": False,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        await db.users.insert_one(user)
    except DuplicateKeyError:
        raise HTTPException(status_code=409, detail="An account with this email already exists.")
    return _auth_response(user)


@clerk_router.post("/auth/login")
async def login(body: LoginRequest):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not _verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    return _auth_response(user)


@clerk_router.api_route("/__clerk/{path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
async def clerk_proxy(path: str, request: Request):
    raise HTTPException(status_code=404, detail="Clerk proxy is not enabled in local authentication mode.")


def require_user(request: Request) -> dict:
    auth = request.headers.get("authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required.", headers={"WWW-Authenticate": "Bearer"})
    token = auth[7:].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Invalid authentication token.", headers={"WWW-Authenticate": "Bearer"})
    try:
        claims = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM], issuer="interview-coach")
        user_id = claims.get("sub")
        if not user_id:
            raise jwt.InvalidTokenError("Missing subject")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Your session has expired. Please sign in again.", headers={"WWW-Authenticate": "Bearer"})
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token.", headers={"WWW-Authenticate": "Bearer"})
    return {
        "user_id": user_id,
        "session_id": token[-16:],
        "claims": claims,
    }
