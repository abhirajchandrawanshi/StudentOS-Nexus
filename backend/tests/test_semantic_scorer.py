"""
tests/test_semantic_scorer.py
──────────────────────────────
Tests for the semantic similarity scoring pipeline.
Uses mocked embedding model to avoid loading sentence-transformers.
"""

from __future__ import annotations

import pytest
import numpy as np
from unittest.mock import MagicMock, patch

from tests.conftest import make_parsed_resume
from app.resume.schemas import ParsedResume, SemanticScoringResult, ProjectRelevance


def _make_mock_model(score: float = 0.75):
    """Create a mock SentenceTransformer that returns controlled embeddings."""
    mock_model = MagicMock()
    # Simulate normalized embeddings: dot product ≈ score
    vec_a = np.array([score ** 0.5] + [0.0] * 383)
    vec_b = np.array([score ** 0.5] + [0.0] * 383)
    # Return enough embeddings for resume + projects + JD
    def mock_encode(texts, **kwargs):
        return np.array([vec_a] * len(texts))
    mock_model.encode = mock_encode
    return mock_model


class TestScoreSemantic:
    def test_returns_semantic_scoring_result(self):
        from app.resume.pipelines.semantic_scorer import score_semantic
        with patch("app.resume.pipelines.semantic_scorer._get_model", return_value=_make_mock_model()):
            result = score_semantic(make_parsed_resume(), "Backend Developer")
        assert isinstance(result, SemanticScoringResult)

    def test_semantic_match_score_in_range(self):
        from app.resume.pipelines.semantic_scorer import score_semantic
        with patch("app.resume.pipelines.semantic_scorer._get_model", return_value=_make_mock_model()):
            result = score_semantic(make_parsed_resume(), "Backend Developer")
        assert 0.0 <= result.semantic_match_score <= 1.0

    def test_project_relevance_list(self):
        from app.resume.pipelines.semantic_scorer import score_semantic
        with patch("app.resume.pipelines.semantic_scorer._get_model", return_value=_make_mock_model()):
            result = score_semantic(make_parsed_resume(), "Backend Developer")
        assert isinstance(result.project_relevance, list)
        assert len(result.project_relevance) == 2  # sample has 2 projects

    def test_project_relevance_scores_in_range(self):
        from app.resume.pipelines.semantic_scorer import score_semantic
        with patch("app.resume.pipelines.semantic_scorer._get_model", return_value=_make_mock_model()):
            result = score_semantic(make_parsed_resume(), "Backend Developer")
        for pr in result.project_relevance:
            assert 0.0 <= pr.relevance_score <= 1.0

    def test_project_relevance_avg_in_range(self):
        from app.resume.pipelines.semantic_scorer import score_semantic
        with patch("app.resume.pipelines.semantic_scorer._get_model", return_value=_make_mock_model()):
            result = score_semantic(make_parsed_resume(), "Backend Developer")
        assert 0.0 <= result.project_relevance_avg <= 1.0

    def test_fallback_when_model_unavailable(self):
        from app.resume.pipelines.semantic_scorer import score_semantic
        with patch("app.resume.pipelines.semantic_scorer._get_model", return_value=None):
            result = score_semantic(make_parsed_resume(), "Backend Developer")
        assert isinstance(result, SemanticScoringResult)
        assert result.semantic_match_score == 0.0

    def test_fallback_when_no_domain_jd(self):
        from app.resume.pipelines.semantic_scorer import score_semantic
        with patch("app.resume.pipelines.semantic_scorer._get_model", return_value=_make_mock_model()):
            with patch("app.resume.pipelines.semantic_scorer.DOMAIN_JD_SNIPPETS", {}):
                result = score_semantic(make_parsed_resume(), "Backend Developer")
        assert result.semantic_match_score == 0.0

    def test_fallback_projects_have_zero_score(self):
        from app.resume.pipelines.semantic_scorer import score_semantic
        with patch("app.resume.pipelines.semantic_scorer._get_model", return_value=None):
            parsed = make_parsed_resume()
            result = score_semantic(parsed, "Backend Developer")
        for pr in result.project_relevance:
            assert pr.relevance_score == 0.0

    def test_empty_resume_handled(self):
        from app.resume.pipelines.semantic_scorer import score_semantic
        parsed = ParsedResume(raw_text="", word_count=0, page_count=0)
        with patch("app.resume.pipelines.semantic_scorer._get_model", return_value=_make_mock_model()):
            result = score_semantic(parsed, "Backend Developer")
        assert isinstance(result, SemanticScoringResult)

    def test_project_reasoning_is_populated(self):
        from app.resume.pipelines.semantic_scorer import score_semantic
        with patch("app.resume.pipelines.semantic_scorer._get_model", return_value=_make_mock_model(0.8)):
            result = score_semantic(make_parsed_resume(), "Backend Developer")
        for pr in result.project_relevance:
            assert isinstance(pr.reasoning, str)
            assert len(pr.reasoning) > 0

    def test_no_projects_returns_empty_list(self):
        from app.resume.pipelines.semantic_scorer import score_semantic
        parsed = make_parsed_resume()
        parsed.projects = []
        with patch("app.resume.pipelines.semantic_scorer._get_model", return_value=_make_mock_model()):
            result = score_semantic(parsed, "Backend Developer")
        assert result.project_relevance == []
        assert result.project_relevance_avg == 0.0

    def test_all_domains_work(self):
        from app.resume.pipelines.semantic_scorer import score_semantic
        from app.resume.config import SUPPORTED_DOMAINS
        parsed = make_parsed_resume()
        with patch("app.resume.pipelines.semantic_scorer._get_model", return_value=_make_mock_model()):
            for domain in SUPPORTED_DOMAINS:
                result = score_semantic(parsed, domain)
                assert isinstance(result, SemanticScoringResult)


class TestBuildResumeEmbeddingText:
    def test_includes_skills(self):
        from app.resume.pipelines.semantic_scorer import _build_resume_embedding_text
        parsed = make_parsed_resume()
        text = _build_resume_embedding_text(parsed)
        assert "python" in text.lower() or "fastapi" in text.lower()

    def test_includes_experience(self):
        from app.resume.pipelines.semantic_scorer import _build_resume_embedding_text
        parsed = make_parsed_resume()
        text = _build_resume_embedding_text(parsed)
        assert "TechCorp" in text or "Backend" in text

    def test_fallback_to_raw_text(self):
        from app.resume.pipelines.semantic_scorer import _build_resume_embedding_text
        parsed = ParsedResume(
            raw_text="Some raw text content here",
            word_count=5,
            page_count=1,
        )
        text = _build_resume_embedding_text(parsed)
        assert "raw text" in text

    def test_non_empty_result(self):
        from app.resume.pipelines.semantic_scorer import _build_resume_embedding_text
        parsed = make_parsed_resume()
        text = _build_resume_embedding_text(parsed)
        assert len(text.strip()) > 0
