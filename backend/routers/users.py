"""User sync + onboarding routes.

Identity is owned by Clerk; this app keeps a lightweight user document and the
onboarding profile keyed by the stable Clerk user id. Every query is scoped to
the signed-in user.
"""

import logging
import os

import requests
from fastapi import APIRouter, Depends
from starlette.concurrency import run_in_threadpool

from clerk_auth import require_user
from lib.dates import aware, utcnow
from lib.db import db
from models.users import MeResponse, OnboardingIn, Profile

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/users", tags=["users"])

CLERK_API = "https://api.clerk.com/v1"


def _fetch_clerk_user(user_id: str) -> dict:
    """One Clerk API call to learn who signed in — only on first sync, never per request."""
    response = requests.get(
        f"{CLERK_API}/users/{user_id}",
        headers={
            "Authorization": f"Bearer {os.environ.get('CLERK_SECRET_KEY', '')}",
            "User-Agent": "emergent-app",
        },
        timeout=10,
    )
    response.raise_for_status()
    return response.json()


def _clerk_fields(clerk_user: dict) -> dict:
    emails = clerk_user.get("email_addresses") or []
    primary_id = clerk_user.get("primary_email_address_id")
    email = next(
        (e["email_address"] for e in emails if e.get("id") == primary_id),
        emails[0]["email_address"] if emails else "",
    )
    name = " ".join(filter(None, [clerk_user.get("first_name"), clerk_user.get("last_name")])).strip()
    return {
        "email": email,
        "name": name or (email.split("@")[0] if email else "Student"),
        "picture": clerk_user.get("image_url") or None,
    }


async def _user_doc(user_id: str, claims: dict | None = None) -> dict:
    doc = await db.users.find_one({"user_id": user_id})
    if doc is None or not doc.get("email"):
        # Local JWT accounts are provisioned at registration. Retain Clerk sync
        # compatibility only when a real Clerk identity is explicitly configured.
        if user_id.startswith("user_") and not os.environ.get("CLERK_SECRET_KEY"):
            fields = {"email": (claims or {}).get("email", ""), "name": (claims or {}).get("name", "Student"), "picture": None}
        else:
            try:
                clerk_user = await run_in_threadpool(_fetch_clerk_user, user_id)
                fields = _clerk_fields(clerk_user)
            except Exception as exc:
                logger.warning("Identity profile fetch failed for %s: %s", user_id, exc)
                fields = {"email": "", "name": "Student", "picture": None}
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": fields, "$setOnInsert": {"user_id": user_id, "created_at": utcnow()}},
            upsert=True,
        )
        doc = await db.users.find_one({"user_id": user_id})
    return doc


@router.get("/me", response_model=MeResponse)
async def get_me(user: dict = Depends(require_user)):
    doc = await _user_doc(user["user_id"], user.get("claims"))
    profile = await db.profiles.find_one({"user_id": user["user_id"]})
    return MeResponse(
        user_id=user["user_id"],
        email=doc.get("email", ""),
        name=doc.get("name", "Student"),
        picture=doc.get("picture"),
        onboarding_completed=bool(doc.get("onboarding_completed", False)),
        profile=Profile(**{k: v for k, v in profile.items() if k != "_id"}) if profile else None,
        created_at=aware(doc["created_at"]) if doc.get("created_at") else utcnow(),
    )


@router.post("/onboarding", response_model=Profile)
async def save_onboarding(body: OnboardingIn, user: dict = Depends(require_user)):
    await _user_doc(user["user_id"], user.get("claims"))  # make sure the user document exists first
    now = utcnow()
    fields = body.model_dump()
    await db.profiles.update_one(
        {"user_id": user["user_id"]},
        {"$set": {**fields, "updated_at": now}, "$setOnInsert": {"user_id": user["user_id"], "created_at": now}},
        upsert=True,
    )
    await db.users.update_one({"user_id": user["user_id"]}, {"$set": {"onboarding_completed": True}})
    saved = await db.profiles.find_one({"user_id": user["user_id"]})
    return Profile(**{k: v for k, v in saved.items() if k != "_id"})
