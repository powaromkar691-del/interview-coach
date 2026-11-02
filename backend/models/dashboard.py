"""Dashboard aggregation models — every number derived from real student data."""

from datetime import datetime

from pydantic import BaseModel

from models.interview import InterviewSummary
from models.roadmap import RoadmapTask


class ScorePoint(BaseModel):
    date: str
    score: float


class DashboardStats(BaseModel):
    interviews_completed: int = 0
    avg_interview_score: float | None = None
    quizzes_taken: int = 0
    avg_quiz_score: float | None = None
    roadmap_progress: float = 0.0


class DashboardData(BaseModel):
    target_role: str | None = None
    stats: DashboardStats
    score_history: list[ScorePoint] = []
    strong_areas: list[str] = []
    weak_areas: list[str] = []
    recommended_tasks: list[RoadmapTask] = []
    recommendations: list[str] = []
    recent_interviews: list[InterviewSummary] = []
