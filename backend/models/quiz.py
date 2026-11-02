"""Quiz generation, submission and attempt models."""

from datetime import datetime

from pydantic import BaseModel, Field

from lib.dates import utcnow
from lib.ids import new_id


class StoredQuizQuestion(BaseModel):
    id: str = Field(default_factory=new_id)
    question: str = Field(min_length=5, max_length=1000)
    options: list[str] = Field(min_length=4, max_length=4)
    correct_index: int = Field(ge=0, le=3)
    explanation: str = Field(default="", max_length=2000)
    difficulty: str = Field(max_length=20)
    topic: str = Field(max_length=80)


class QuizQuestionPublic(BaseModel):
    """What the student sees while answering — correct answer and explanation withheld."""

    id: str
    question: str
    options: list[str]
    difficulty: str
    topic: str


class QuizSet(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    topic: str = Field(max_length=80)
    difficulty: str = Field(max_length=20)
    questions: list[StoredQuizQuestion] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=utcnow)


class QuizSetResponse(BaseModel):
    id: str
    topic: str
    difficulty: str
    source: str  # "ai" or "bank" (fallback when the LLM is unavailable)
    questions: list[QuizQuestionPublic]


class QuizGenerateIn(BaseModel):
    topic: str = Field(min_length=2, max_length=80)
    difficulty: str = Field(pattern="^(easy|medium|hard)$")
    count: int = Field(default=5, ge=1, le=10)


class QuizAnswerIn(BaseModel):
    question_id: str
    selected_index: int = Field(ge=0, le=3)


class QuizSubmitIn(BaseModel):
    answers: list[QuizAnswerIn] = Field(min_length=1, max_length=10)


class QuizResultItem(BaseModel):
    question_id: str
    question: str
    options: list[str]
    selected_index: int
    correct_index: int
    correct: bool
    explanation: str = ""


class QuizAttempt(BaseModel):
    id: str = Field(default_factory=new_id)
    user_id: str
    topic: str = Field(max_length=80)
    difficulty: str = Field(max_length=20)
    total: int = Field(ge=1, le=10)
    correct: int = Field(ge=0, le=10)
    score_pct: float = Field(ge=0, le=100)
    created_at: datetime = Field(default_factory=utcnow)


class QuizSubmitResponse(BaseModel):
    attempt: QuizAttempt
    results: list[QuizResultItem]
