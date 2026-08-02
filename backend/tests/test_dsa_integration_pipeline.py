from __future__ import annotations

import pytest

from app.dsa.analytics_engine import analyze_profile_stats
from app.dsa.pipelines.company_mapper import get_company_intelligence
from app.dsa.pipelines.topic_analyzer import analyze_topics
from app.dsa.pipelines.recommendation_engine import generate_recommended_questions
from app.dsa.pipelines.roadmap_generator import generate_weekly_roadmap
from app.dsa.pipelines.company_readiness import compute_company_readiness


@pytest.mark.asyncio
async def test_pipeline_stage_compatibility_smoke() -> None:
    profile = {
        "submitStats": {"acSubmissionNum": [
            {"difficulty": "All", "count": 20},
            {"difficulty": "Easy", "count": 10},
            {"difficulty": "Medium", "count": 8},
            {"difficulty": "Hard", "count": 2},
        ]},
        "tagProblemCounts": {
            "fundamental": [{"tagSlug": "array", "problemsSolved": 5}],
            "intermediate": [{"tagSlug": "dynamic-programming", "problemsSolved": 2}],
            "advanced": [{"tagSlug": "graph", "problemsSolved": 1}],
        },
    }

    analytics = analyze_profile_stats(profile)
    company = get_company_intelligence("Amazon")
    topics = analyze_topics(analytics, company)
    questions = generate_recommended_questions(
        weak_topics=topics["weak_topics"],
        solved_questions=[],
        company=company["company"],
        total=20,
    )
    roadmap = generate_weekly_roadmap(
        weak_topics=topics["weak_topics"],
        company=company["company"],
        domain="Backend Developer",
        questions=questions,
    )
    readiness = compute_company_readiness(analytics=analytics, weak_topics=topics["weak_topics"])

    assert isinstance(analytics, dict)
    assert isinstance(topics, dict)
    assert isinstance(questions, list)
    assert isinstance(roadmap, dict)
    assert isinstance(readiness, dict)
