"""Static technical-prep topic catalog (public, no user data)."""

from fastapi import APIRouter

from lib.content import TOPICS

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("")
async def list_topics():
    return {"topics": TOPICS}
