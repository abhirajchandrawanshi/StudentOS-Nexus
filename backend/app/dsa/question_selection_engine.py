from __future__ import annotations

from collections import Counter
from typing import Any, Dict, List, Optional

from app.dsa.question_dataset import load_questions
from app.dsa.pipelines.company_mapper import recommend_topics


DIFFICULTY_TARGETS = {
    "Easy": 0.4,
    "Medium": 0.4,
    "Hard": 0.2,
}


def _normalize_topics(topics: Optional[List[str]]) -> List[str]:
    return [topic.strip().title() for topic in (topics or []) if topic and topic.strip()]


def _difficulty_weight(difficulty: str) -> int:
    return {"Easy": 1, "Medium": 2, "Hard": 3}.get(difficulty.capitalize(), 2)


def _expected_time(difficulty: str) -> str:
    return {"Easy": "20-30 min", "Medium": "35-50 min", "Hard": "50-70 min"}.get(difficulty.capitalize(), "35-50 min")


def select_questions(
    *,
    company: str,
    weak_topics: Optional[List[str]] = None,
    completed_questions: Optional[List[str | int]] = None,
) -> List[Dict[str, Any]]:
    """Select 20 interview-style questions for a company and weak-topic focus."""
    weak_topics = _normalize_topics(weak_topics or [])
    completed_questions = {str(q) for q in (completed_questions or [])}

    questions = load_questions()

    company_questions = [
        question
        for question in questions
        if company.lower() in {item.lower() for item in question.get("companies", [])}
    ]

    if not company_questions:
        company_questions = questions

    filtered = []
    for question in company_questions:
        question_id = str(question.get("id"))
        if question_id in completed_questions:
            continue
        if any(str(question_id) == value for value in completed_questions):
            continue

        question_topics = _normalize_topics(question.get("topics", []))
        filtered.append(question)

    if not filtered:
        filtered = company_questions

    topic_scores = Counter()
    for topic in weak_topics:
        topic_scores[topic] += 3

    for question in filtered:
        question_topics = _normalize_topics(question.get("topics", []))
        score = 0
        for topic in question_topics:
            score += topic_scores.get(topic, 0)
        score += question.get("frequency_score", 0) // 10
        question["__selection_score"] = score

    filtered.sort(key=lambda item: item.get("__selection_score", 0), reverse=True)

    difficulty_counts = Counter({"Easy": 8, "Medium": 8, "Hard": 4})
    selected: List[Dict[str, Any]] = []
    used_ids = set()

    for question in filtered:
        if len(selected) >= 20:
            break

        question_id = str(question.get("id"))
        if question_id in used_ids:
            continue

        difficulty = question.get("difficulty", "Medium")
        difficulty_name = difficulty.capitalize()
        if difficulty_counts[difficulty_name] <= 0:
            continue

        used_ids.add(question_id)
        difficulty_counts[difficulty_name] -= 1
        selected.append(question)

    if len(selected) < 20:
        for question in filtered:
            if len(selected) >= 20:
                break
            question_id = str(question.get("id"))
            if question_id in used_ids:
                continue
            used_ids.add(question_id)
            selected.append(question)

    recommendations = []
    for index, question in enumerate(selected[:20], start=1):
        difficulty = question.get("difficulty", "Medium").capitalize()
        topic_matches = [topic for topic in _normalize_topics(question.get("topics", [])) if topic.lower() in {t.lower() for t in weak_topics}]
        if topic_matches:
            reason = f"Targets weak topic(s): {', '.join(topic_matches)}"
        else:
            reason = f"Strong fit for {company.title()} interview patterns"

        recommendations.append(
            {
                "priority": index,
                "question": {
                    "id": question.get("id"),
                    "title": question.get("title"),
                    "difficulty": difficulty,
                    "topics": question.get("topics", []),
                    "companies": question.get("companies", []),
                    "url": question.get("url"),
                },
                "difficulty": difficulty,
                "reason": reason,
                "priority": index,
                "expected_time": _expected_time(difficulty),
            }
        )

    return recommendations
