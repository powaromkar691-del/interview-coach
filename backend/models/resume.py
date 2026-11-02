"""Resume upload/analysis models."""

from datetime import datetime

from pydantic import BaseModel, Field

from lib.dates import utcnow
from lib.ids import new_id


class ResumeSections(BaseModel):
    education: list[str] = Field(default_factory=list, max_length=15)
    skills: list[str] = Field(default_factory=list, max_length=40)
    projects: list[str] = Field(default_factory=list, max_length=15)
    experience: list[str] = Field(default_factory=list, max_length=15)


class JdMatch(BaseModel):
    matched_skills: list[str] = Field(default_factory=list, max_length=40)
    missing_skills: list[str] = Field(default_factory=list, max_length=40)
    verdict: str = Field(default="", max_length=2000)


class ResumeAnalysis(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    filename: str = Field(max_length=200)
    created_at: datetime = Field(default_factory=utcnow)
    ats_score: int = Field(ge=0, le=100)
    summary: str = Field(default="", max_length=4000)
    sections: ResumeSections = Field(default_factory=ResumeSections)
    grammar_suggestions: list[str] = Field(default_factory=list, max_length=15)
    missing_information: list[str] = Field(default_factory=list, max_length=15)
    extraction_notes: list[str] = Field(default_factory=list, max_length=15)
    improvements: list[str] = Field(default_factory=list, max_length=15)
    jd_match: JdMatch | None = None
