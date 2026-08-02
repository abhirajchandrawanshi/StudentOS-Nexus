from __future__ import annotations

import pytest

from app.dsa.analytics_service import DSAAnalyticsService


class FakeRepo:
    def __init__(self) -> None:
        self.saved_roadmaps = 0
        self.saved_readiness = 0

    async def save_roadmap_progress(self, **kwargs):
        self.saved_roadmaps += 1
        return "roadmap-row-id"

    async def save_company_readiness(self, **kwargs):
        self.saved_readiness += 1
        return "readiness-row-id"


@pytest.mark.asyncio
async def test_analytics_service_build_dashboard(monkeypatch) -> None:
    async def fake_fetch(username: str):
        return {
            "username": username,
            "profile": {"realName": "Demo", "userAvatar": None, "ranking": 123},
            "submitStats": {"acSubmissionNum": [
                {"difficulty": "All", "count": 10},
                {"difficulty": "Easy", "count": 4},
                {"difficulty": "Medium", "count": 5},
                {"difficulty": "Hard", "count": 1},
            ]},
            "tagProblemCounts": {
                "fundamental": [{"tagSlug": "array", "problemsSolved": 3}],
                "intermediate": [{"tagSlug": "dynamic-programming", "problemsSolved": 1}],
                "advanced": [{"tagSlug": "graph", "problemsSolved": 0}],
            },
        }

    monkeypatch.setattr("app.dsa.analytics_service.fetch_leetcode_profile", fake_fetch)

    repo = FakeRepo()
    service = DSAAnalyticsService(repo=repo, gemini_model=None)

    response = await service.build_dashboard(
        username="demo_user",
        company="Amazon",
        domain="Backend Developer",
    )

    assert response["username"] == "demo_user"
    assert "recommended_questions" in response
    assert "roadmap" in response
    assert "company_readiness" in response
    assert "ai_mentor" in response
    assert repo.saved_roadmaps == 1
    assert repo.saved_readiness == 1
