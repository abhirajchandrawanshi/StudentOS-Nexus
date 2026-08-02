from __future__ import annotations

from typing import Any, Dict, List, Optional

from app.dsa.company_mapper import get_company_profile
from app.dsa.question_dataset import load_questions


WEEKLY_THEME_ORDER = [
    "Foundation",
    "Arrays & Strings",
    "Trees & Graphs",
    "Dynamic Programming",
    "Advanced Graphs",
    "System Design Style DSA",
    "Company Drill",
    "Revision & Mock Interview",
]


def _normalize_topics(topics: Optional[List[str]]) -> List[str]:
    return [topic.strip().title() for topic in (topics or []) if topic and topic.strip()]


def _difficulty_for_week(index: int) -> str:
    if index < 2:
        return "Easy"
    if index < 5:
        return "Medium"
    return "Hard"


def _estimate_hours(index: int, weak_topics: List[str]) -> int:
    base = 6 + index
    if any(topic in weak_topics for topic in ["Graphs", "DP"]):
        base += 2
    return base


def _build_week_payload(index: int, weak_topics: List[str], company_profile: Dict[str, Any], questions_pool: List[Dict[str, Any]]) -> Dict[str, Any]:
    topic_focus = WEEKLY_THEME_ORDER[index]
    topic_candidates = []
    for topic in weak_topics + ["Arrays", "Strings", "Trees", "Graphs", "DP"]:
        if topic not in topic_candidates:
            topic_candidates.append(topic)

    selected_topics = topic_candidates[:3]
    selected_questions = []
    used_ids = set()

    for question in questions_pool:
        if len(selected_questions) >= 3:
            break
        question_topics = _normalize_topics(question.get("topics", []))
        if not set(question_topics).intersection(selected_topics):
            continue
        question_id = str(question.get("id"))
        if question_id in used_ids:
            continue
        used_ids.add(question_id)
        selected_questions.append(
            {
                "id": question.get("id"),
                "title": question.get("title"),
                "difficulty": question.get("difficulty"),
                "topics": question.get("topics", []),
            }
        )

    if len(selected_questions) < 3:
        for question in questions_pool[:5]:
            if len(selected_questions) >= 3:
                break
            question_id = str(question.get("id"))
            if question_id in used_ids:
                continue
            used_ids.add(question_id)
            selected_questions.append(
                {
                    "id": question.get("id"),
                    "title": question.get("title"),
                    "difficulty": question.get("difficulty"),
                    "topics": question.get("topics", []),
                }
            )

    difficulty = _difficulty_for_week(index)
    milestone = {
        "Foundation": "Complete core pattern drills",
        "Arrays & Strings": "Solve sliding window and prefix-sum problems",
        "Trees & Graphs": "Master traversal and shortest-path patterns",
        "Dynamic Programming": "Practice state transition and memoization",
        "Advanced Graphs": "Handle graph optimization and cycle detection",
        "System Design Style DSA": "Combine data structures with scalable reasoning",
        "Company Drill": f"Align with {company_profile['companyName']} interview patterns",
        "Revision & Mock Interview": "Revise weak areas and simulate interviews",
    }[topic_focus]

    learning_objective = {
        "Foundation": "Build confidence with core patterns and coding fluency",
        "Arrays & Strings": "Improve array manipulation and string problem solving",
        "Trees & Graphs": "Develop strong traversal and graph reasoning",
        "Dynamic Programming": "Learn memoization and state-based transitions",
        "Advanced Graphs": "Tackle harder graph and connectivity problems",
        "System Design Style DSA": "Connect DSA with scalable and production-oriented thinking",
        "Company Drill": "Practice company-relevant problem styles and time management",
        "Revision & Mock Interview": "Consolidate gaps and rehearse explanation quality",
    }[topic_focus]

    return {
        "week": index + 1,
        "topics": selected_topics,
        "questions": selected_questions,
        "estimated_hours": _estimate_hours(index, weak_topics),
        "milestone": milestone,
        "difficulty": difficulty,
        "learning_objective": learning_objective,
    }


def generate_personalized_roadmap(
    *,
    leetcodeAnalytics: Optional[Dict[str, Any]] = None,
    targetCompany: Optional[str] = None,
    targetDomain: Optional[str] = None,
    weakTopics: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Generate an 8-week personalized DSA roadmap as JSON-ready data."""
    analytics = leetcodeAnalytics or {}
    weak_topics = _normalize_topics(weakTopics or [])
    company_profile = get_company_profile(targetCompany or "Startups")

    questions_pool = load_questions()
    if weak_topics:
        questions_pool = [
            question for question in questions_pool if set(_normalize_topics(question.get("topics", []))).intersection(weak_topics)
        ] or questions_pool

    weeks = [
        _build_week_payload(week_index, weak_topics, company_profile, questions_pool)
        for week_index in range(8)
    ]

    return {
        "duration_weeks": 8,
        "target_company": company_profile["companyName"],
        "target_domain": targetDomain or "General Software Engineering",
        "weak_topics": weak_topics,
        "weeks": weeks,
    }
