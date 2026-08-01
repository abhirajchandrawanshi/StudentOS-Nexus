from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional


DATA_FILE = Path(__file__).resolve().parent / "data" / "questions.json"
EXTRA_DATA_FILE = Path(__file__).resolve().parent / "data" / "questions_extra.json"


def load_questions() -> List[Dict[str, Any]]:
    """Load the JSON-backed question dataset from disk."""
    with DATA_FILE.open("r", encoding="utf-8") as handle:
        questions = json.load(handle)

    if EXTRA_DATA_FILE.exists():
        with EXTRA_DATA_FILE.open("r", encoding="utf-8") as handle:
            questions.extend(json.load(handle))

    return questions


def filter_questions(
    *,
    company: Optional[str] = None,
    difficulty: Optional[str] = None,
    topic: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Return questions filtered by company, difficulty, and/or topic."""
    questions = load_questions()

    if company:
        company_lower = company.lower()
        questions = [
            question for question in questions if any(item.lower() == company_lower for item in question.get("companies", []))
        ]

    if difficulty:
        difficulty_lower = difficulty.lower()
        questions = [
            question for question in questions if question.get("difficulty", "").lower() == difficulty_lower
        ]

    if topic:
        topic_lower = topic.lower()
        questions = [
            question for question in questions if any(item.lower() == topic_lower for item in question.get("topics", []))
        ]

    return questions


def get_question_by_id(question_id: int) -> Optional[Dict[str, Any]]:
    """Return a single question by id if present."""
    for question in load_questions():
        if question.get("id") == question_id:
            return question
    return None
