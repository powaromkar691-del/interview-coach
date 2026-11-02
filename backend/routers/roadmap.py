"""Personalized learning roadmap routes: AI plan generation from the student's
profile + weak areas, retrieval and per-task completion tracking."""

import logging

from fastapi import APIRouter, Depends, HTTPException
from typing import Optional

from clerk_auth import require_user
from lib.dates import aware, utcnow
from lib.db import db
from lib.insights import skill_areas
from lib.llm import LLMError, complete, parse_json
from lib.ratelimit import enforce
from models.roadmap import Roadmap, RoadmapGenerateIn, RoadmapTask, TaskStatusIn

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/roadmap", tags=["roadmap"])

TASK_TYPES = {"learn", "practice", "quiz", "mock", "revise"}
SYSTEM = (
    "You are an experienced placement mentor who builds realistic weekly study plans for Indian "
    "engineering students. Always reply with valid JSON only."
)


@router.post("/generate", response_model=Roadmap, status_code=201)
async def generate_roadmap(body: RoadmapGenerateIn, user: dict = Depends(require_user)):
    enforce(f"roadmap-generate:{user['user_id']}", limit=4, window_seconds=600)
    profile = await db.profiles.find_one({"user_id": user["user_id"]})
    if not profile:
        raise HTTPException(status_code=400, detail="Complete onboarding first so the plan can be personalized.")

    areas = await skill_areas(user["user_id"])
    prompt = (
        f"Build a {body.weeks}-week preparation roadmap for a student targeting the role "
        f"'{profile.get('target_role', 'Software Engineer')}'.\n"
        f"Preparation level: {profile.get('prep_level', 'beginner')}. Available study time: about "
        f"{profile.get('weekly_hours', 8)} hours per week. Preferred schedule: {profile.get('schedule_pref', 'flexible')}.\n"
        f"Skills they already list: {', '.join(profile.get('skills', [])[:20]) or 'none listed'}.\n"
        f"Weak areas measured from their past performance (prioritize these): "
        f"{', '.join(areas['weak'][:6]) or 'no data yet — cover the fundamentals for the target role'}.\n"
        f"Strong areas (maintain, do not over-invest): {', '.join(areas['strong'][:4]) or 'none measured yet'}.\n"
        f"Extra focus requested: {', '.join(body.focus_areas[:6]) or 'none'}.\n"
        f"Plan {body.weeks} week(s) with 4-6 tasks per week; each task must fit roughly "
        f"{max(1, profile.get('weekly_hours', 8) // 5)} hours and respect the schedule preference.\n"
        "task_type must be one of: learn, practice, quiz, mock, revise.\n"
        'Reply with JSON only: {"tasks": [{"week": 1, "title": "...", "description": "1-2 sentences '
        'with concrete instructions", "topic": "...", "task_type": "practice", "estimated_minutes": 60}]}'
    )

    try:
        data = parse_json(await complete(SYSTEM, prompt, session_id=f"roadmap-{user['user_id']}"))
    except (LLMError, KeyError, TypeError, ValueError) as exc:
        logger.warning("roadmap generation failed: %s", exc)
        raise HTTPException(
            status_code=503, detail="The AI mentor is unavailable right now. Please try again in a moment."
        )

    tasks: list[RoadmapTask] = []
    for item in (data.get("tasks") or [])[: body.weeks * 8]:
        try:
            task_type = str(item.get("task_type", "practice")).strip().lower()
            tasks.append(
                RoadmapTask(
                    week=int(max(1, min(body.weeks, int(item.get("week", 1))))),
                    title=str(item["title"]).strip()[:200],
                    description=str(item.get("description", "")).strip()[:1500],
                    topic=str(item.get("topic", "general")).strip()[:80] or "general",
                    task_type=task_type if task_type in TASK_TYPES else "practice",
                    estimated_minutes=int(max(5, min(240, int(item.get("estimated_minutes", 60))))),
                )
            )
        except (KeyError, TypeError, ValueError):
            continue
    if not tasks:
        raise HTTPException(
            status_code=503, detail="The AI mentor could not produce a valid plan. Please try again in a moment."
        )

    roadmap = Roadmap(user_id=user["user_id"], target_role=profile.get("target_role", "Software Engineer"), weeks=body.weeks, tasks=tasks)
    await db.roadmaps.replace_one({"user_id": user["user_id"]}, roadmap.model_dump(), upsert=True)
    return roadmap


@router.get("", response_model=Optional[Roadmap])
async def get_roadmap(user: dict = Depends(require_user)):
    doc = await db.roadmaps.find_one({"user_id": user["user_id"]})
    if not doc:
        return None
    doc.pop("_id", None)
    doc["created_at"] = aware(doc["created_at"])
    return Roadmap(**doc)


@router.patch("/tasks/{task_id}", response_model=Roadmap)
async def update_task_status(task_id: str, body: TaskStatusIn, user: dict = Depends(require_user)):
    doc = await db.roadmaps.find_one({"user_id": user["user_id"]})
    if not doc or not any(t["id"] == task_id for t in doc.get("tasks", [])):
        raise HTTPException(status_code=404, detail="Task not found")
    await db.roadmaps.update_one(
        {"user_id": user["user_id"], "tasks.id": task_id}, {"$set": {"tasks.$.status": body.status}}
    )
    doc = await db.roadmaps.find_one({"user_id": user["user_id"]})
    tasks = doc.get("tasks", [])
    progress = round(100 * sum(1 for t in tasks if t["status"] == "completed") / max(1, len(tasks)), 1)
    await db.roadmaps.update_one({"user_id": user["user_id"]}, {"$set": {"progress_pct": progress}})
    doc.pop("_id", None)
    doc["progress_pct"] = progress
    doc["created_at"] = aware(doc["created_at"])
    return Roadmap(**doc)
