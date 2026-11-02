"""Personalized learning roadmap models."""

from datetime import datetime

from pydantic import BaseModel, Field

from lib.dates import utcnow
from lib.ids import new_id


class RoadmapTask(BaseModel):
    id: str = Field(default_factory=new_id)
    week: int = Field(ge=1, le=12)
    title: str = Field(min_length=3, max_length=200)
    description: str = Field(default="", max_length=1500)
    topic: str = Field(default="general", max_length=80)
    task_type: str = Field(default="practice", pattern="^(learn|practice|quiz|mock|revise)$")
    estimated_minutes: int = Field(default=60, ge=5, le=240)
    status: str = Field(default="todo", pattern="^(todo|in_progress|completed)$")


class Roadmap(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    target_role: str = Field(max_length=120)
    weeks: int = Field(ge=1, le=4)
    tasks: list[RoadmapTask] = Field(default_factory=list, max_length=40)
    progress_pct: float = Field(default=0.0, ge=0, le=100)
    created_at: datetime = Field(default_factory=utcnow)


class RoadmapGenerateIn(BaseModel):
    weeks: int = Field(default=2, ge=1, le=4)
    focus_areas: list[str] = Field(default_factory=list, max_length=10)


class TaskStatusIn(BaseModel):
    status: str = Field(pattern="^(todo|in_progress|completed)$")
