"""
tests/test_gemini_analyzer.py
──────────────────────────────
Tests for the Gemini AI analysis pipeline.
Gemini is always mocked — no real API calls.
"""

from __future__ import annotations

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from tests.conftest import make_parsed_resume, make_skill_result, make_ats_result, make_semantic_result
from app.resume.schemas import GeminiInsights, ImprovementSuggestion


def _make_gemini_model(response_json: dict | None = None) -> MagicMock:
    """Return a mock Google GenAI client."""

    model = MagicMock()

    if response_json is None:
        response_json = {
            "ai_summary": "Para1. Para2. Para3.",
            "top_strengths": [
                "Python expertise",
                "Microservices",
                "Quantified results",
            ],
            "top_improvements": [
                {
                    "original_text": "worked on tasks",
                    "suggested_text": (
                        "Engineered systems achieving 40% latency reduction"
                    ),
                    "reasoning": "Adds impact metrics.",
                }
            ],
            "gemini_holistic_score": 72,
            "placement_readiness_level": "Almost Ready",
            "learning_roadmap": [
                "Learn gRPC",
                "Study Kafka streams",
            ],
            "missing_competencies": [
                "gRPC",
                "Kafka",
            ],
        }

    mock_response = MagicMock()
    mock_response.text = json.dumps(response_json)

    # New Google GenAI SDK interface:
    # client.models.generate_content(...)
    model.models.generate_content = MagicMock(
        return_value=mock_response
    )

    return model

class TestAnalyzeWithGemini:
    @pytest.mark.asyncio
    async def test_returns_gemini_insights_with_model(self):
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        model = _make_gemini_model()
        result = await analyze_with_gemini(
            model, make_parsed_resume(), "Backend Developer",
            make_skill_result(), make_ats_result(), make_semantic_result()
        )
        assert isinstance(result, GeminiInsights)

    @pytest.mark.asyncio
    async def test_returns_fallback_when_model_none(self):
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        result = await analyze_with_gemini(
            None, make_parsed_resume(), "Backend Developer",
            make_skill_result(), make_ats_result(), make_semantic_result()
        )
        assert isinstance(result, GeminiInsights)
        assert result.gemini_holistic_score >= 0.0

    @pytest.mark.asyncio
    async def test_ai_summary_populated(self):
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        model = _make_gemini_model()
        result = await analyze_with_gemini(
            model, make_parsed_resume(), "Backend Developer",
            make_skill_result(), make_ats_result(), make_semantic_result()
        )
        assert len(result.ai_summary) > 0

    @pytest.mark.asyncio
    async def test_top_strengths_list(self):
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        model = _make_gemini_model()
        result = await analyze_with_gemini(
            model, make_parsed_resume(), "Backend Developer",
            make_skill_result(), make_ats_result(), make_semantic_result()
        )
        assert isinstance(result.top_strengths, list)
        assert len(result.top_strengths) <= 3

    @pytest.mark.asyncio
    async def test_top_improvements_are_improvement_suggestion_instances(self):
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        model = _make_gemini_model()
        result = await analyze_with_gemini(
            model, make_parsed_resume(), "Backend Developer",
            make_skill_result(), make_ats_result(), make_semantic_result()
        )
        for imp in result.top_improvements:
            assert isinstance(imp, ImprovementSuggestion)
            assert isinstance(imp.original_text, str)
            assert isinstance(imp.suggested_text, str)
            assert isinstance(imp.reasoning, str)

    @pytest.mark.asyncio
    async def test_holistic_score_in_range(self):
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        model = _make_gemini_model()
        result = await analyze_with_gemini(
            model, make_parsed_resume(), "Backend Developer",
            make_skill_result(), make_ats_result(), make_semantic_result()
        )
        assert 0.0 <= result.gemini_holistic_score <= 100.0

    @pytest.mark.asyncio
    async def test_placement_readiness_level_valid(self):
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        model = _make_gemini_model()
        result = await analyze_with_gemini(
            model, make_parsed_resume(), "Backend Developer",
            make_skill_result(), make_ats_result(), make_semantic_result()
        )
        assert result.placement_readiness_level in {"Ready", "Almost Ready", "Needs Work", "Not Ready"}

    @pytest.mark.asyncio
    async def test_learning_roadmap_populated(self):
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        model = _make_gemini_model()
        result = await analyze_with_gemini(
            model, make_parsed_resume(), "Backend Developer",
            make_skill_result(), make_ats_result(), make_semantic_result()
        )
        assert isinstance(result.learning_roadmap, list)
        assert len(result.learning_roadmap) > 0

    @pytest.mark.asyncio
    async def test_missing_competencies_populated(self):
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        model = _make_gemini_model()
        result = await analyze_with_gemini(
            model, make_parsed_resume(), "Backend Developer",
            make_skill_result(), make_ats_result(), make_semantic_result()
        )
        assert isinstance(result.missing_competencies, list)

    @pytest.mark.asyncio
    async def test_handles_malformed_gemini_json(self):
        """Should fall back gracefully when Gemini returns invalid JSON."""
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = "This is not valid JSON at all!!!"
        model.generate_content = MagicMock(return_value=mock_response)

        result = await analyze_with_gemini(
            model, make_parsed_resume(), "Backend Developer",
            make_skill_result(), make_ats_result(), make_semantic_result()
        )
        assert isinstance(result, GeminiInsights)

    @pytest.mark.asyncio
    async def test_handles_gemini_api_exception(self):
        """Should fall back after all retries are exhausted."""
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        model = MagicMock()
        model.generate_content = MagicMock(side_effect=Exception("API error"))

        with patch("app.resume.pipelines.gemini_analyzer.asyncio.sleep", new_callable=AsyncMock):
            result = await analyze_with_gemini(
                model, make_parsed_resume(), "Backend Developer",
                make_skill_result(), make_ats_result(), make_semantic_result()
            )
        assert isinstance(result, GeminiInsights)

    @pytest.mark.asyncio
    async def test_score_clamped_to_100(self):
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        response = {
            "ai_summary": "summary",
            "top_strengths": ["s1"],
            "top_improvements": [],
            "gemini_holistic_score": 999,  # out of range
            "placement_readiness_level": "Ready",
            "learning_roadmap": [],
            "missing_competencies": [],
        }
        model = _make_gemini_model(response)
        result = await analyze_with_gemini(
            model, make_parsed_resume(), "Backend Developer",
            make_skill_result(), make_ats_result(), make_semantic_result()
        )
        assert result.gemini_holistic_score <= 100.0

    @pytest.mark.asyncio
    async def test_fallback_level_derived_from_score(self):
        from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
        response = {
            "ai_summary": "summary",
            "top_strengths": [],
            "top_improvements": [],
            "gemini_holistic_score": 85,
            "placement_readiness_level": "INVALID LEVEL",  # invalid
            "learning_roadmap": ["step1"],
            "missing_competencies": [],
        }
        model = _make_gemini_model(response)
        result = await analyze_with_gemini(
            model, make_parsed_resume(), "Backend Developer",
            make_skill_result(), make_ats_result(), make_semantic_result()
        )
        assert result.placement_readiness_level == "Ready"  # score=85 → Ready


class TestFallbackInsights:
    def test_fallback_returns_gemini_insights(self):
        from app.resume.pipelines.gemini_analyzer import _fallback_insights
        ats = make_ats_result()
        skill = make_skill_result()
        result = _fallback_insights(ats, skill)
        assert isinstance(result, GeminiInsights)

    def test_fallback_score_in_range(self):
        from app.resume.pipelines.gemini_analyzer import _fallback_insights
        result = _fallback_insights(make_ats_result(), make_skill_result())
        assert 0.0 <= result.gemini_holistic_score <= 100.0

    def test_fallback_has_placement_level(self):
        from app.resume.pipelines.gemini_analyzer import _fallback_insights
        result = _fallback_insights(make_ats_result(), make_skill_result())
        assert result.placement_readiness_level in {"Ready", "Almost Ready", "Needs Work", "Not Ready"}

    def test_fallback_has_roadmap(self):
        from app.resume.pipelines.gemini_analyzer import _fallback_insights
        result = _fallback_insights(make_ats_result(), make_skill_result())
        assert isinstance(result.learning_roadmap, list)
        assert len(result.learning_roadmap) > 0

    def test_fallback_missing_competencies_from_skills(self):
        from app.resume.pipelines.gemini_analyzer import _fallback_insights
        skill = make_skill_result()
        result = _fallback_insights(make_ats_result(), skill)
        assert set(result.missing_competencies).issubset(set(skill.missing_skills))


class TestScoreToReadinessLevel:
    def test_ready(self):
        from app.resume.pipelines.gemini_analyzer import _score_to_readiness_level
        assert _score_to_readiness_level(85) == "Ready"

    def test_almost_ready(self):
        from app.resume.pipelines.gemini_analyzer import _score_to_readiness_level
        assert _score_to_readiness_level(65) == "Almost Ready"

    def test_needs_work(self):
        from app.resume.pipelines.gemini_analyzer import _score_to_readiness_level
        assert _score_to_readiness_level(50) == "Needs Work"

    def test_not_ready(self):
        from app.resume.pipelines.gemini_analyzer import _score_to_readiness_level
        assert _score_to_readiness_level(20) == "Not Ready"
