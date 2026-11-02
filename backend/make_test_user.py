"""Idempotently ensure the two Clerk test users exist; seed Priya's onboarding
profile; print one-time sign-in ticket URLs for automated browsers (Clerk's bot
protection blocks headless password sign-in — tickets bypass it).

Usage: cd /app/backend && python make_test_user.py
"""

import asyncio
import json
import os
import urllib.error
import urllib.parse
import urllib.request

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))

from lib.dates import utcnow  # noqa: E402
from lib.db import db  # noqa: E402

API = "https://api.clerk.com/v1"
HEADERS = {
    "Authorization": f"Bearer {os.environ.get('CLERK_SECRET_KEY', '')}",
    "Content-Type": "application/json",
    "User-Agent": "emergent-app",
}

USERS = [
    {"email": "priya+clerk_test@example.com", "password": "Test-pass-12345!", "name": "Priya", "onboard": True},
    {"email": "rahul+clerk_test@example.com", "password": "Test-pass-12345!", "name": "Rahul", "onboard": False},
]

PROFILE = {
    "full_name": "Priya Sharma",
    "degree": "B.Tech",
    "branch": "Computer Science",
    "graduation_year": 2026,
    "skills": ["Python", "C++", "SQL", "React", "Data Structures"],
    "projects": ["Campus placement portal — React, FastAPI, MongoDB", "Movie recommender — Python, Pandas"],
    "experience": "Summer intern at a fintech startup; led the college coding club.",
    "target_role": "Software Engineer",
    "prep_level": "intermediate",
    "weekly_hours": 8,
    "schedule_pref": "Evenings",
}


def bapi(path: str, body=None, method: str = "POST"):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(API + path, data=data, method=method, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.load(res)


def find_user(email: str):
    found = bapi(f"/users?email_address={urllib.parse.quote(email)}&limit=10", method="GET")
    for candidate in found:
        if any(e["email_address"].lower() == email.lower() for e in candidate.get("email_addresses", [])):
            return candidate
    return None


def ensure_user(email: str, password: str, name: str) -> dict:
    user = find_user(email)
    if user:
        return user
    try:
        return bapi("/users", {"email_address": [email], "password": password, "skip_password_checks": True, "first_name": name})
    except urllib.error.HTTPError:
        user = find_user(email)
        if user is None:
            raise
        return user


async def seed_onboarded(clerk_user_id: str) -> None:
    now = utcnow()
    await db.profiles.update_one(
        {"user_id": clerk_user_id},
        {"$set": {**PROFILE, "user_id": clerk_user_id, "updated_at": now}, "$setOnInsert": {"created_at": now}},
        upsert=True,
    )
    await db.users.update_one({"user_id": clerk_user_id}, {"$set": {"onboarding_completed": True}}, upsert=True)


def main() -> None:
    for spec in USERS:
        user = ensure_user(spec["email"], spec["password"], spec["name"])
        ticket = bapi("/sign_in_tokens", {"user_id": user["id"], "expires_in_seconds": 600})["token"]
        if spec["onboard"]:
            asyncio.run(seed_onboarded(user["id"]))
        label = "onboarded" if spec["onboard"] else "not onboarded"
        print(f"{spec['email']} ({label}): http://localhost:3000/sign-in?__clerk_ticket={ticket}")


if __name__ == "__main__":
    main()
