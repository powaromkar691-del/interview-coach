"""Quiz routes: AI-generated MCQ sets (with a static fallback bank), server-side
grading and attempt history. Correct answers never leave the backend unasked."""

import logging
import random

from fastapi import APIRouter, Depends, HTTPException

from clerk_auth import require_user
from lib.content import FALLBACK_BANK
from lib.dates import aware, utcnow
from lib.db import db
from lib.llm import LLMError, complete, parse_json
from lib.ratelimit import enforce
from models.quiz import (
    QuizAnswerIn,
    QuizAttempt,
    QuizGenerateIn,
    QuizQuestionPublic,
    QuizSet,
    QuizSetResponse,
    QuizSubmitIn,
    QuizSubmitResponse,
    QuizResultItem,
    StoredQuizQuestion,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/quizzes", tags=["quizzes"])

SYSTEM = (
    "You are an expert placement-prep instructor for Indian engineering students. You write "
    "precise multiple-choice questions with exactly four options, exactly one correct answer and "
    "a concise explanation. Always reply with valid JSON only."
)


def _quiz_prompt(topic: str, difficulty: str, count: int, avoid: list[str]) -> str:
    lines = [
        f"Write {count} multiple-choice questions on '{topic}' at {difficulty} difficulty for placement preparation.",
    ]
    if avoid:
        lines.append("Avoid these questions the student has already seen (do not repeat them):\n- " + "\n- ".join(avoid))
    lines.append("Each question must have exactly 4 options and exactly one correct option.")
    lines.append(
        'Reply with JSON only: {"questions": [{"question": "...", "options": ["A", "B", "C", "D"], '
        '"correct_index": 0-3, "explanation": "1-3 sentences", "difficulty": "' + difficulty + '"}]}'
    )
    return "\n".join(lines)


@router.post("/generate", response_model=QuizSetResponse, status_code=201)
async def generate_quiz(body: QuizGenerateIn, user: dict = Depends(require_user)):
    enforce(f"quiz-generate:{user['user_id']}", limit=10, window_seconds=300)
    topic = body.topic.strip()[:80]

    avoid: list[str] = []
    past_sets = await db.quiz_sets.find(
        {"user_id": user["user_id"], "topic": topic}, {"questions.question": 1}
    ).sort("created_at", -1).to_list(3)
    for past in past_sets:
        avoid.extend(q["question"] for q in past.get("questions", []))
    avoid = avoid[:15]

    questions: list[StoredQuizQuestion] = []
    source = "ai"
    try:
        data = parse_json(
            await complete(SYSTEM, _quiz_prompt(topic, body.difficulty, body.count, avoid), session_id=f"quiz-{user['user_id']}")
        )
        for item in (data.get("questions") or [])[: body.count]:
            options = [str(o)[:200] for o in (item.get("options") or [])]
            correct_index = int(item.get("correct_index", -1))
            if len(options) != 4 or not 0 <= correct_index <= 3 or not str(item.get("question", "")).strip():
                continue
            questions.append(
                StoredQuizQuestion(
                    question=str(item["question"]).strip()[:1000],
                    options=options,
                    correct_index=correct_index,
                    explanation=str(item.get("explanation", ""))[:2000],
                    difficulty=body.difficulty,
                    topic=topic,
                )
            )
    except (LLMError, KeyError, TypeError, ValueError) as exc:
        logger.warning("quiz generation failed, falling back to the static bank: %s", exc)
        questions = []

    if not questions:
        # Graceful fallback: serve curated bank questions so practice never hard-fails.
        bank = FALLBACK_BANK.get(topic, [])
        if not bank:
            raise HTTPException(
                status_code=503,
                detail="AI quiz generation is unavailable right now. Please try again in a moment.",
            )
        source = "bank"
        picked = random.sample(bank, k=min(body.count, len(bank)))
        questions = [
            StoredQuizQuestion(
                question=item["question"],
                options=item["options"],
                correct_index=item["correct_index"],
                explanation=item["explanation"],
                difficulty=item["difficulty"],
                topic=topic,
            )
            for item in picked
        ]
    elif len(questions) < body.count:
        seen = {q.question for q in questions}
        for item in FALLBACK_BANK.get(topic, []):
            if item["question"] not in seen:
                questions.append(
                    StoredQuizQuestion(
                        question=item["question"],
                        options=item["options"],
                        correct_index=item["correct_index"],
                        explanation=item["explanation"],
                        difficulty=item["difficulty"],
                        topic=topic,
                    )
                )
                seen.add(item["question"])
            if len(questions) >= body.count:
                break

    quiz_set = QuizSet(user_id=user["user_id"], topic=topic, difficulty=body.difficulty, questions=questions)
    await db.quiz_sets.insert_one(quiz_set.model_dump())
    return QuizSetResponse(
        id=quiz_set.id,
        topic=quiz_set.topic,
        difficulty=quiz_set.difficulty,
        source=source,
        questions=[
            QuizQuestionPublic(id=q.id, question=q.question, options=q.options, difficulty=q.difficulty, topic=q.topic)
            for q in questions
        ],
    )


@router.post("/{quiz_id}/submit", response_model=QuizSubmitResponse)
async def submit_quiz(quiz_id: str, body: QuizSubmitIn, user: dict = Depends(require_user)):
    enforce(f"quiz-submit:{user['user_id']}", limit=20, window_seconds=300)
    quiz_set = await db.quiz_sets.find_one({"id": quiz_id, "user_id": user["user_id"]})
    if not quiz_set:
        raise HTTPException(status_code=404, detail="Quiz not found — it may have expired; generate a new one.")

    by_id = {q["id"]: q for q in quiz_set.get("questions", [])}
    results: list[QuizResultItem] = []
    correct = 0
    for answer in body.answers:
        q = by_id.get(answer.question_id)
        if not q:
            continue
        is_correct = answer.selected_index == q["correct_index"]
        correct += int(is_correct)
        results.append(
            QuizResultItem(
                question_id=q["id"],
                question=q["question"],
                options=q["options"],
                selected_index=answer.selected_index,
                correct_index=q["correct_index"],
                correct=is_correct,
                explanation=q.get("explanation", ""),
            )
        )
    if not results:
        raise HTTPException(status_code=400, detail="No valid answers were submitted.")

    attempt = QuizAttempt(
        user_id=user["user_id"],
        topic=quiz_set["topic"],
        difficulty=quiz_set["difficulty"],
        total=len(results),
        correct=correct,
        score_pct=round(correct / len(results) * 100, 1),
    )
    await db.quiz_attempts.insert_one(attempt.model_dump())
    return QuizSubmitResponse(attempt=attempt, results=results)


@router.get("/attempts", response_model=list[QuizAttempt])
async def list_attempts(user: dict = Depends(require_user)):
    docs = await db.quiz_attempts.find({"user_id": user["user_id"]}).sort("created_at", -1).to_list(50)
    results = []
    for doc in docs:
        doc.pop("_id", None)
        doc["created_at"] = aware(doc["created_at"])
        results.append(QuizAttempt(**doc))
    return results
