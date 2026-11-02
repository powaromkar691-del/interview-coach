"""Aggregate a student's real performance data into skill-area insights."""

import logging
from collections import defaultdict

from lib.db import db

logger = logging.getLogger(__name__)


async def skill_areas(user_id: str) -> dict:
    """Average score (0-10) per topic across interview evaluations and quizzes.

    Returns {"strong": [...], "weak": [...], "topic_scores": {topic: avg}} —
    strong = averaged >= 7.0, weak = averaged < 6.0, each needs at least one data point.
    """
    topic_scores: dict[str, list[float]] = defaultdict(list)

    async for interview in db.interviews.find({"user_id": user_id}, {"questions": 1, "answers": 1}):
        question_map = {q["id"]: q for q in interview.get("questions", [])}
        for answer in interview.get("answers", []):
            question = question_map.get(answer.get("question_id"))
            topic = (question or {}).get("topic")
            if topic:
                topic_scores[topic].append(float(answer["evaluation"]["score"]))

    async for attempt in db.quiz_attempts.find({"user_id": user_id}, {"topic": 1, "score_pct": 1}):
        topic_scores[attempt["topic"]].append(float(attempt["score_pct"]) / 10.0)

    averaged = {topic: (sum(scores) / len(scores), len(scores)) for topic, scores in topic_scores.items() if scores}
    strong = sorted((t for t, (avg, _) in averaged.items() if avg >= 7.0), key=lambda t: -averaged[t][0])
    weak = sorted((t for t, (avg, _) in averaged.items() if avg < 6.0), key=lambda t: averaged[t][0])
    return {"strong": strong, "weak": weak, "topic_scores": {t: round(avg, 1) for t, (avg, _) in averaged.items()}}
