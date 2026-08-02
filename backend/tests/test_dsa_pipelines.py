from __future__ import annotations

import pytest

from app.dsa.pipelines.ai_mentor import generate_ai_mentor_guidance
from app.dsa.pipelines.company_mapper import get_company_intelligence
from app.dsa.pipelines.company_readiness import compute_company_readiness
from app.dsa.pipelines.recommendation_engine import generate_recommended_questions
from app.dsa.pipelines.topic_analyzer import analyze_topics
from app.dsa.question_bank import get_all_questions
from app.dsa.recommendation_engine import generate_dynamic_leetcode_sheet
from app.dsa.solved_questions import infer_solved_question_slugs


def test_company_mapper_returns_structured_dataset() -> None:
    data = get_company_intelligence("Amazon")
    assert data["company"] == "Amazon"
    assert set(data["topic_weights"].keys()) == {"Arrays", "Trees", "Graphs", "DP", "Strings"}
    assert isinstance(data["frequently_asked_topics"], list)
    assert isinstance(data["interview_trends"], list)


def test_topic_analyzer_outputs_expected_sections() -> None:
    analytics = {
        "topics": [
            {"topic": "Arrays", "solved": 45, "total": 50},
            {"topic": "Graphs", "solved": 5, "total": 40},
            {"topic": "DP", "solved": 0, "total": 50},
        ]
    }
    company = {
        "topic_weights": {"Arrays": 10, "Trees": 15, "Graphs": 40, "DP": 30, "Strings": 5}
    }

    result = analyze_topics(analytics, company)

    assert "strong_topics" in result
    assert "weak_topics" in result
    assert "missing_topics" in result
    assert "topic_scores" in result
    assert "Arrays" in result["strong_topics"]
    assert "DP" in result["missing_topics"]


def test_recommendation_engine_returns_20_unique_questions_with_mix() -> None:
    questions = generate_recommended_questions(
        weak_topics=["Graphs", "DP"],
        solved_questions=["two-sum", "coin-change"],
        company="Amazon",
        total=20,
    )

    assert len(questions) == 13  # 15 questions in dataset minus 2 explicitly solved slugs.
    ids = [q["id"] for q in questions]
    assert len(ids) == len(set(ids))
    assert all(q["titleSlug"] not in {"two-sum", "coin-change"} for q in questions)


def test_company_readiness_is_bounded() -> None:
    analytics = {
        "stats": {"all": 120, "easy": 60, "medium": 45, "hard": 15},
        "topics": [
            {"topic": "Arrays", "solved": 25, "total": 50},
            {"topic": "Trees", "solved": 20, "total": 45},
            {"topic": "Graphs", "solved": 10, "total": 40},
            {"topic": "DP", "solved": 8, "total": 50},
            {"topic": "Strings", "solved": 18, "total": 40},
        ],
    }
    result = compute_company_readiness(analytics=analytics, weak_topics=["Graphs", "DP"])

    assert 0.0 <= result["score"] <= 100.0
    assert "Readiness is" in result["explanation"]


@pytest.mark.asyncio
async def test_ai_mentor_fallback_without_gemini() -> None:
    result = await generate_ai_mentor_guidance(
        gemini_model=None,
        analytics={"stats": {}},
        weak_topics=["Graphs"],
        roadmap={"weeks": []},
        readiness={"score": 55.0},
    )

    assert result["source"] == "fallback"
    assert isinstance(result["weeklyGoals"], list)


def test_infer_solved_slugs_maps_topic_tags_to_question_slugs() -> None:
    profile_data = {
        "tagProblemCounts": {
            "fundamental": [{"tagSlug": "array", "problemsSolved": 2}],
            "intermediate": [{"tagSlug": "dynamic-programming", "problemsSolved": 1}],
            "advanced": [],
        }
    }
    solved_slugs = infer_solved_question_slugs(profile_data=profile_data, questions=get_all_questions())
    solved_set = set(solved_slugs)

    assert "two-sum" in solved_set
    assert "coin-change" in solved_set


def test_legacy_sheet_excludes_inferred_solved_slugs() -> None:
    profile_data = {
        "tagProblemCounts": {
            "fundamental": [{"tagSlug": "array", "problemsSolved": 2}],
            "intermediate": [],
            "advanced": [],
        }
    }
    solved_slugs = infer_solved_question_slugs(profile_data=profile_data, questions=get_all_questions())

    questions = generate_dynamic_leetcode_sheet(
        username="demo",
        priorities={"Arrays": 100},
        total_q=2,
        readiness=35.0,
        target_companies=["Amazon"],
        solved_questions_slugs=solved_slugs,
    )

    assert all(question["titleSlug"] != "two-sum" for question in questions)
