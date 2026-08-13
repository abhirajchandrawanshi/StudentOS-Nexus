"""
tests/test_repository.py
─────────────────────────
Tests for ResumeRepository in stateless (no-DB) mode.
"""

from __future__ import annotations

import pytest

from tests.conftest import make_parsed_resume, make_ats_result, make_skill_result
from app.resume.repository import ResumeRepository


@pytest.fixture
def stateless_repo() -> ResumeRepository:
    """Repository with no DB session — all writes are no-ops."""
    return ResumeRepository(session=None)


class TestResumeRepositoryStateless:
    @pytest.mark.asyncio
    async def test_save_upload_returns_none_without_db(self, stateless_repo):
        result = await stateless_repo.save_upload(
            filename="test.pdf",
            target_domain="Backend Developer",
            page_count=2,
            word_count=500,
        )
        assert result is None

    @pytest.mark.asyncio
    async def test_get_analysis_by_id_returns_none_without_db(self, stateless_repo):
        import uuid
        result = await stateless_repo.get_analysis_by_id(str(uuid.uuid4()))
        assert result is None

    @pytest.mark.asyncio
    async def test_get_user_history_returns_empty_without_db(self, stateless_repo):
        result = await stateless_repo.get_user_history("user123")
        assert result == []

    @pytest.mark.asyncio
    async def test_save_analysis_returns_none_without_db(self, stateless_repo):
        from tests.conftest import (
            make_parsed_resume,
            make_ats_result,
            make_skill_result,
            make_semantic_result,
            make_gemini_insights,
        )
        from app.resume.schemas import ResumeAnalysisReport, KeywordAnalysis, ATSBreakdown
        import uuid

        report = ResumeAnalysisReport(
            analysis_id=None,
            target_domain="Backend Developer",
            filename="test.pdf",
            ats_score=75.0,
            domain_match_pct=70.0,
            placement_readiness_score=72.0,
            missing_skills=["kafka"],
            weak_sections=[],
            formatting_suggestions=[],
            keyword_analysis=make_skill_result().keyword_analysis,
            project_relevance=[],
            ats_breakdown=make_ats_result().breakdown,
            gemini_insights=make_gemini_insights(),
            parsed=make_parsed_resume(),
        )
        result = await stateless_repo.save_analysis(
            upload_id=uuid.uuid4(),
            report=report,
            semantic_match_score=0.75,
            duration_ms=1200,
        )
        assert result is None


class TestGetSessionFactory:
    def test_returns_none_without_database_url(self, monkeypatch):
        import importlib
        import os
        monkeypatch.delenv("DATABASE_URL", raising=False)

        # Reset the cached factory
        import app.resume.repository as repo_module
        repo_module._async_session_factory = None

        factory = repo_module.get_session_factory()
        assert factory is None
