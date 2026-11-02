"""Interview session, question, evaluation and feedback-report models."""

from datetime import datetime

from pydantic import BaseModel, Field

from lib.dates import utcnow
from lib.ids import new_id


class InterviewQuestion(BaseModel):
    id: str = Field(default_factory=new_id)
    question: str = Field(min_length=5, max_length=2000)
    topic: str = Field(default="general", max_length=60)
    difficulty: str = Field(default="medium", max_length=20)
    criteria: list[str] = Field(default_factory=list, max_length=5)
    is_follow_up: bool = False
    base_question_id: str | None = None


class AnswerEvaluation(BaseModel):
    score: float = Field(ge=0, le=10)
    feedback: str = Field(default="", max_length=4000)
    strengths: list[str] = Field(default_factory=list, max_length=8)
    improvements: list[str] = Field(default_factory=list, max_length=8)
    missing_concepts: list[str] = Field(default_factory=list, max_length=8)
    suggested_answer: str = Field(default="", max_length=4000)


class InterviewAnswer(BaseModel):
    question_id: str
    answer: str = Field(max_length=8000)
    evaluated_at: datetime = Field(default_factory=utcnow)
    evaluation: AnswerEvaluation


class InterviewReport(BaseModel):
    overall_score: float = Field(ge=0, le=100)
    summary: str = Field(default="", max_length=4000)
    strengths: list[str] = Field(default_factory=list, max_length=10)
    weaknesses: list[str] = Field(default_factory=list, max_length=10)
    missing_concepts: list[str] = Field(default_factory=list, max_length=10)
    topics_to_revise: list[str] = Field(default_factory=list, max_length=10)
    next_steps: list[str] = Field(default_factory=list, max_length=10)


class InterviewSession(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    role: str = Field(max_length=80)
    interview_type: str = Field(pattern="^(hr|technical|project|behavioral|role_specific)$")
    difficulty: str = Field(pattern="^(easy|medium|hard)$")
    num_questions: int = Field(ge=3, le=10)
    status: str = Field(default="in_progress", pattern="^(in_progress|completed)$")
    questions: list[InterviewQuestion] = Field(default_factory=list)
    answers: list[InterviewAnswer] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utcnow)
    completed_at: datetime | None = None
    report: InterviewReport | None = None


class InterviewSummary(BaseModel):
    id: str
    role: str
    interview_type: str
    difficulty: str
    status: str
    num_questions: int
    overall_score: float | None = None
    created_at: datetime
    completed_at: datetime | None = None


class InterviewCreateIn(BaseModel):
    role: str = Field(min_length=2, max_length=80)
    interview_type: str = Field(pattern="^(hr|technical|project|behavioral|role_specific)$")
    difficulty: str = Field(pattern="^(easy|medium|hard)$")
    num_questions: int = Field(ge=3, le=10)


class AnswerIn(BaseModel):
    answer: str = Field(min_length=2, max_length=8000)


class AnswerResponse(BaseModel):
    question_id: str
    evaluation: AnswerEvaluation
    next_question: InterviewQuestion | None = None
    status: str = "in_progress"
    report: InterviewReport | None = None
