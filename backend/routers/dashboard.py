"""Dashboard aggregation route — every number computed from real student data."""

import statistics

from fastapi import APIRouter, Depends

from clerk_auth import require_user
from lib.dates import aware
from lib.db import db
from lib.insights import skill_areas
from models.dashboard import DashboardData, DashboardStats, ScorePoint
from models.interview import InterviewSummary
from models.roadmap import RoadmapTask
from routers.interviews import _summary as interview_summary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardData)
async def get_dashboard(user: dict = Depends(require_user)):
    uid = user["user_id"]
    profile = await db.profiles.find_one({"user_id": uid})

    interviews = await db.interviews.find({"user_id": uid}).sort("created_at", -1).to_list(200)
    completed = [d for d in interviews if d.get("status") == "completed" and d.get("report")]
    scores = [d["report"]["overall_score"] for d in completed]
    avg_score = round(statistics.mean(scores), 1) if scores else None

    # Chart series: oldest -> latest, last 10 completed sessions.
    history = [
        ScorePoint(
            date=aware(d["completed_at"]).strftime("%d %b") if d.get("completed_at") else aware(d["created_at"]).strftime("%d %b"),
            score=d["report"]["overall_score"],
        )
        for d in list(reversed(completed[-10:]))
    ]

    attempts = await db.quiz_attempts.find({"user_id": uid}).sort("created_at", -1).to_list(200)
    pcts = [a["score_pct"] for a in attempts]
    avg_quiz = round(statistics.mean(pcts), 1) if pcts else None

    areas = await skill_areas(uid)

    roadmap_doc = await db.roadmaps.find_one({"user_id": uid})
    recommended: list[RoadmapTask] = []
    if roadmap_doc:
        recommended = [
            RoadmapTask(**t)
            for t in roadmap_doc.get("tasks", [])
            if t.get("status") != "completed"
        ][:4]

    recommendations = [f"Revise {topic}" for topic in areas["weak"][:4]]

    return DashboardData(
        target_role=profile.get("target_role") if profile else None,
        stats=DashboardStats(
            interviews_completed=len(completed),
            avg_interview_score=avg_score,
            quizzes_taken=len(attempts),
            avg_quiz_score=avg_quiz,
            roadmap_progress=(roadmap_doc or {}).get("progress_pct", 0.0),
        ),
        score_history=history,
        strong_areas=areas["strong"][:6],
        weak_areas=areas["weak"][:6],
        recommended_tasks=recommended,
        recommendations=recommendations,
        recent_interviews=[interview_summary(d) for d in interviews[:5]],
    )
