"""
tests/test_service.py
──────────────────────
Tests for the ResumeAnalysisService pipeline orchestration.
All heavy pipeline stages are mocked.
"""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from tests.conftest import (
    make_parsed_resume,
    make_raw_resume_text,
    make_skill_result,
    make_ats_result,
    make_semantic_result,
    make_gemini_insights,
)
from app.resume.schemas import ResumeAnalysisReport
from app.resume.repository import ResumeRepository
from app.resume.service import (
    ResumeAnalysisService,
    _compute_placement_readiness,
)


def _make_service(with_gemini: bool = False) -> ResumeAnalysisService:
    gemini = MagicMock() if with_gemini else None
    return ResumeAnalysisService(
        repository=ResumeRepository(session=None),
        gemini_model=gemini,
    )


def _patch_pipeline(parsed=None, skill=None, ats=None, semantic=None, gemini=None):
    """Return a context manager that patches all pipeline stages."""
    import contextlib
    from unittest.mock import patch, AsyncMock

    if parsed is None:
        parsed = make_parsed_resume()
    if skill is None:
        skill = make_skill_result()
    if ats is None:
        ats = make_ats_result()
    if semantic is None:
        semantic = make_semantic_result()
    if gemini is None:
        gemini = make_gemini_insights()

    raw = make_raw_resume_text()

    patches = [
        patch("app.resume.service.extract_pdf_text", new=AsyncMock(return_value=raw)),
        patch("app.resume.service.parse_resume_sections", return_value=parsed),
        patch("app.resume.service.analyze_skills", return_value=skill),
        patch("app.resume.service.score_ats", return_value=ats),
        patch("app.resume.service.score_semantic", return_value=semantic),
        patch("app.resume.service.analyze_with_gemini", new=AsyncMock(return_value=gemini)),
    ]

    @contextlib.contextmanager
    def _ctx():
        with contextlib.ExitStack() as stack:
            for p in patches:
                stack.enter_context(p)
            yield

    return _ctx()


class TestResumeAnalysisService:
    @pytest.mark.asyncio
    async def test_analyze_returns_report(self):
        service = _make_service()
        with _patch_pipeline():
            report = await service.analyze(
                file_bytes=b"%PDF fake",
                filename="resume.pdf",
                target_domain="Backend Developer",
                user_id=None,
            )
        assert isinstance(report, ResumeAnalysisReport)

    @pytest.mark.asyncio
    async def test_analyze_scores_in_range(self):
        service = _make_service()
        with _patch_pipeline():
            report = await service.analyze(
                file_bytes=b"%PDF fake",
                filename="resume.pdf",
                target_domain="Backend Developer",
            )
        assert 0.0 <= report.ats_score <= 100.0
        assert 0.0 <= report.domain_match_pct <= 100.0
        assert 0.0 <= report.placement_readiness_score <= 100.0

    @pytest.mark.asyncio
    async def test_analyze_report_has_gemini_insights(self):
        service = _make_service()
        with _patch_pipeline():
            report = await service.analyze(
                file_bytes=b"%PDF fake",
                filename="resume.pdf",
                target_domain="Backend Developer",
            )
        assert report.gemini_insights is not None
        assert report.gemini_insights.placement_readiness_level in {
            "Ready", "Almost Ready", "Needs Work", "Not Ready"
        }

    @pytest.mark.asyncio
    async def test_analyze_raises_value_error_on_empty_text(self):
        from app.resume.schemas import RawResumeText
        service = _make_service()
        empty_raw = RawResumeText(full_text="", page_count=0)
        with patch("app.resume.service.extract_pdf_text", new=AsyncMock(return_value=empty_raw)):
            with pytest.raises(ValueError, match="Could not extract text"):
                await service.analyze(
                    file_bytes=b"%PDF fake",
                    filename="resume.pdf",
                    target_domain="Backend Developer",
                )

    @pytest.mark.asyncio
    async def test_invalid_domain_defaults_gracefully(self):
        service = _make_service()
        with _patch_pipeline():
            report = await service.analyze(
                file_bytes=b"%PDF fake",
                filename="resume.pdf",
                target_domain="Nonexistent Domain",
            )
        assert isinstance(report, ResumeAnalysisReport)

    @pytest.mark.asyncio
    async def test_pipeline_stage_failure_degrades_gracefully(self):
        """If skill_analyzer crashes, pipeline should use empty fallback."""
        service = _make_service()
        raw = make_raw_resume_text()
        parsed = make_parsed_resume()
        ats = make_ats_result()
        semantic = make_semantic_result()
        gemini = make_gemini_insights()

        with (
            patch("app.resume.service.extract_pdf_text", new=AsyncMock(return_value=raw)),
            patch("app.resume.service.parse_resume_sections", return_value=parsed),
            patch("app.resume.service.analyze_skills", side_effect=RuntimeError("Skill crash")),
            patch("app.resume.service.score_ats", return_value=ats),
            patch("app.resume.service.score_semantic", return_value=semantic),
            patch("app.resume.service.analyze_with_gemini", new=AsyncMock(return_value=gemini)),
        ):
            report = await service.analyze(
                file_bytes=b"%PDF fake",
                filename="resume.pdf",
                target_domain="Backend Developer",
            )
        assert isinstance(report, ResumeAnalysisReport)
        assert report.domain_match_pct == 0.0  # from empty fallback

    @pytest.mark.asyncio
    async def test_report_filename_preserved(self):
        service = _make_service()
        with _patch_pipeline():
            report = await service.analyze(
                file_bytes=b"%PDF fake",
                filename="my_resume.pdf",
                target_domain="Backend Developer",
            )
        assert report.filename == "my_resume.pdf"

    @pytest.mark.asyncio
    async def test_report_target_domain_preserved(self):
        service = _make_service()
        with _patch_pipeline():
            report = await service.analyze(
                file_bytes=b"%PDF fake",
                filename="resume.pdf",
                target_domain="Backend Developer",
            )
        assert report.target_domain == "Backend Developer"

    @pytest.mark.asyncio
    async def test_report_missing_skills_populated(self):
        service = _make_service()
        with _patch_pipeline():
            report = await service.analyze(
                file_bytes=b"%PDF fake",
                filename="resume.pdf",
                target_domain="Backend Developer",
            )
        assert isinstance(report.missing_skills, list)


class TestComputePlacementReadiness:
    def test_returns_float_in_range(self):
        score = _compute_placement_readiness(
            ats_score=75.0,
            domain_match_pct=70.0,
            semantic_match_score=0.65,
            project_relevance_avg=0.70,
            gemini_holistic_score=68.0,
        )
        assert 0.0 <= score <= 100.0

    def test_perfect_scores_give_high_readiness(self):
        score = _compute_placement_readiness(
            ats_score=100.0,
            domain_match_pct=100.0,
            semantic_match_score=1.0,
            project_relevance_avg=1.0,
            gemini_holistic_score=100.0,
        )
        assert score >= 95.0

    def test_zero_scores_give_zero_readiness(self):
        score = _compute_placement_readiness(
            ats_score=0.0,
            domain_match_pct=0.0,
            semantic_match_score=0.0,
            project_relevance_avg=0.0,
            gemini_holistic_score=0.0,
        )
        assert score == 0.0

    def test_weights_sum_to_one(self):
        """Verify that the formula uses weights that approximately sum to 1.0."""
        from app.resume.config import SCORING_WEIGHTS
        total = sum(SCORING_WEIGHTS.values())
        assert abs(total - 1.0) < 0.001

    def test_is_clamped_to_100(self):
        """Even with inflated inputs, result must not exceed 100."""
        score = _compute_placement_readiness(
            ats_score=150.0,
            domain_match_pct=200.0,
            semantic_match_score=5.0,
            project_relevance_avg=5.0,
            gemini_holistic_score=200.0,
        )
        assert score <= 100.0
