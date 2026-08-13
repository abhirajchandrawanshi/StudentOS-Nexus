"""
tests/test_e2e.py
──────────────────
End-to-end pipeline tests that run the full service pipeline
with mocked Gemini and mocked PDF parser (but real skill/ATS/section logic).
"""

from __future__ import annotations

import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from tests.conftest import SAMPLE_RESUME_TEXT
from app.resume.schemas import (
    RawResumeText,
    ResumeAnalysisReport,
    GeminiInsights,
    ImprovementSuggestion,
)
from app.resume.repository import ResumeRepository
from app.resume.service import ResumeAnalysisService


# ─── E2E Service Pipeline ─────────────────────────────────────────────────────

def _make_gemini_response() -> dict:
    return {
        "ai_summary": "Para1. Para2. Para3.",
        "top_strengths": ["Python expertise", "Microservices architecture", "Quantified impact"],
        "top_improvements": [
            {
                "original_text": "worked on tasks",
                "suggested_text": "Engineered distributed systems",
                "reasoning": "More impactful language.",
            }
        ],
        "gemini_holistic_score": 74,
        "placement_readiness_level": "Almost Ready",
        "learning_roadmap": ["Learn gRPC", "Study Kafka"],
        "missing_competencies": ["gRPC", "Kafka"],
    }


def _make_mock_gemini_model() -> MagicMock:
    model = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = json.dumps(_make_gemini_response())
    model.generate_content = MagicMock(return_value=mock_resp)
    return model


def _make_mock_embedding_model():
    """Returns a mock embedder that produces deterministic vectors."""
    import numpy as np
    mock_model = MagicMock()

    def encode(texts, **kwargs):
        # Return unit vectors so dot product ~= 0.7
        n = len(texts)
        vecs = np.full((n, 384), 0.05)
        vecs[:, 0] = 0.83  # Makes cosine similarity ≈ 0.7
        norms = np.linalg.norm(vecs, axis=1, keepdims=True)
        return vecs / norms

    mock_model.encode = encode
    return mock_model


@pytest.mark.asyncio
async def test_full_pipeline_backend_developer():
    """
    End-to-end: parse a real resume text through all pipeline stages
    (only Gemini and embedding model are mocked).
    """
    raw = RawResumeText(full_text=SAMPLE_RESUME_TEXT, page_count=2)
    gemini_model = _make_mock_gemini_model()
    embedding_model = _make_mock_embedding_model()
    repo = ResumeRepository(session=None)

    service = ResumeAnalysisService(repository=repo, gemini_model=gemini_model)

    with (
        patch("app.resume.service.extract_pdf_text", new=AsyncMock(return_value=raw)),
        patch("app.resume.pipelines.semantic_scorer._get_model", return_value=embedding_model),
    ):
        report = await service.analyze(
            file_bytes=b"%PDF fake",
            filename="sample_resume.pdf",
            target_domain="Backend Developer",
            user_id="user-e2e-test",
        )

    # ── Scores ───────────────────────────────────────────────────────
    assert isinstance(report, ResumeAnalysisReport)
    assert 0.0 <= report.ats_score <= 100.0
    assert 0.0 <= report.domain_match_pct <= 100.0
    assert 0.0 <= report.placement_readiness_score <= 100.0

    # ── Skill analysis ────────────────────────────────────────────────
    assert len(report.keyword_analysis.found_keywords) > 0
    assert isinstance(report.missing_skills, list)

    # ── ATS breakdown ─────────────────────────────────────────────────
    bd = report.ats_breakdown
    for score in [bd.keyword_score, bd.format_score, bd.length_score,
                  bd.section_completeness_score, bd.action_verbs_score]:
        assert 0.0 <= score <= 100.0

    # ── Project relevance ─────────────────────────────────────────────
    assert isinstance(report.project_relevance, list)
    for pr in report.project_relevance:
        assert 0.0 <= pr.relevance_score <= 1.0
        assert len(pr.reasoning) > 0

    # ── Gemini insights ───────────────────────────────────────────────
    gi = report.gemini_insights
    assert isinstance(gi, GeminiInsights)
    assert len(gi.ai_summary) > 0
    assert gi.placement_readiness_level in {"Ready", "Almost Ready", "Needs Work", "Not Ready"}
    assert isinstance(gi.learning_roadmap, list)
    assert len(gi.learning_roadmap) > 0
    assert isinstance(gi.missing_competencies, list)

    # ── Parsed resume ─────────────────────────────────────────────────
    parsed = report.parsed
    assert parsed.email_found is True
    assert parsed.phone_found is True
    assert len(parsed.skills) > 0
    assert len(parsed.experience) > 0

    # ── No analysis_id (no DB) ────────────────────────────────────────
    assert report.analysis_id is None


@pytest.mark.asyncio
async def test_full_pipeline_frontend_developer():
    """Backend resume analyzed against Frontend domain — domain_match should be lower."""
    raw = RawResumeText(full_text=SAMPLE_RESUME_TEXT, page_count=2)
    embedding_model = _make_mock_embedding_model()
    repo = ResumeRepository(session=None)
    service = ResumeAnalysisService(repository=repo, gemini_model=None)

    with (
        patch("app.resume.service.extract_pdf_text", new=AsyncMock(return_value=raw)),
        patch("app.resume.pipelines.semantic_scorer._get_model", return_value=embedding_model),
    ):
        report = await service.analyze(
            file_bytes=b"%PDF fake",
            filename="resume.pdf",
            target_domain="Frontend Developer",
        )

    # A backend resume should have low match against frontend domain
    assert isinstance(report, ResumeAnalysisReport)
    assert report.domain_match_pct < 60.0  # Should not match well


@pytest.mark.asyncio
async def test_full_pipeline_no_gemini_uses_fallback():
    """When Gemini is None, rule-based fallback should still produce complete output."""
    raw = RawResumeText(full_text=SAMPLE_RESUME_TEXT, page_count=2)
    embedding_model = _make_mock_embedding_model()
    repo = ResumeRepository(session=None)
    service = ResumeAnalysisService(repository=repo, gemini_model=None)

    with (
        patch("app.resume.service.extract_pdf_text", new=AsyncMock(return_value=raw)),
        patch("app.resume.pipelines.semantic_scorer._get_model", return_value=embedding_model),
    ):
        report = await service.analyze(
            file_bytes=b"%PDF fake",
            filename="resume.pdf",
            target_domain="Backend Developer",
        )

    gi = report.gemini_insights
    assert isinstance(gi.placement_readiness_level, str)
    assert gi.placement_readiness_level in {"Ready", "Almost Ready", "Needs Work", "Not Ready"}
    assert isinstance(gi.learning_roadmap, list)
    assert isinstance(gi.missing_competencies, list)


@pytest.mark.asyncio
async def test_full_pipeline_all_domains():
    """Every supported domain should complete without error."""
    from app.resume.config import SUPPORTED_DOMAINS

    raw = RawResumeText(full_text=SAMPLE_RESUME_TEXT, page_count=2)
    embedding_model = _make_mock_embedding_model()
    repo = ResumeRepository(session=None)
    service = ResumeAnalysisService(repository=repo, gemini_model=None)

    with (
        patch("app.resume.service.extract_pdf_text", new=AsyncMock(return_value=raw)),
        patch("app.resume.pipelines.semantic_scorer._get_model", return_value=embedding_model),
    ):
        for domain in SUPPORTED_DOMAINS:
            report = await service.analyze(
                file_bytes=b"%PDF fake",
                filename="resume.pdf",
                target_domain=domain,
            )
            assert isinstance(report, ResumeAnalysisReport)
            assert 0.0 <= report.placement_readiness_score <= 100.0


@pytest.mark.asyncio
async def test_rewrite_pipeline():
    """E2E test for the resume rewrite flow."""
    raw = RawResumeText(full_text=SAMPLE_RESUME_TEXT, page_count=2)
    mock_model = MagicMock()
    mock_resp = MagicMock()
    mock_resp.text = "# Rewritten Resume\n\n## Summary\nImproved backend engineer."
    mock_model.generate_content = MagicMock(return_value=mock_resp)

    from app.resume.pipelines.gemini_analyzer import rewrite_resume_with_gemini

    with patch("app.resume.pipelines.gemini_analyzer.asyncio.to_thread", new=AsyncMock(return_value=mock_resp)):
        result = await rewrite_resume_with_gemini(
            mock_model,
            SAMPLE_RESUME_TEXT,
            "Backend Developer",
        )

    assert isinstance(result, str)
    assert len(result.strip()) > 0


@pytest.mark.asyncio
async def test_placement_readiness_matches_expected_formula():
    """Verify the composite score formula is applied correctly."""
    from app.resume.service import _compute_placement_readiness
    from app.resume.config import SCORING_WEIGHTS

    ats = 80.0
    domain = 70.0
    semantic = 0.65
    proj_avg = 0.70
    gemini = 68.0

    expected = (
        SCORING_WEIGHTS["ats_score"] * ats
        + SCORING_WEIGHTS["domain_match_pct"] * domain
        + SCORING_WEIGHTS["semantic_match_score"] * semantic * 100
        + SCORING_WEIGHTS["project_relevance_avg"] * proj_avg * 100
        + SCORING_WEIGHTS["gemini_holistic_score"] * gemini
    )

    actual = _compute_placement_readiness(ats, domain, semantic, proj_avg, gemini)
    assert abs(actual - min(expected, 100.0)) < 0.01
