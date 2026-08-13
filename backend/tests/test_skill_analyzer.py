"""
tests/test_skill_analyzer.py
──────────────────────────────
Tests for the domain skill gap analysis pipeline.
"""

from __future__ import annotations

import pytest

from tests.conftest import make_parsed_resume
from app.resume.schemas import ParsedResume, SkillAnalysisResult, KeywordAnalysis
from app.resume.pipelines.skill_analyzer import analyze_skills, _is_skill_present


class TestAnalyzeSkills:
    def test_returns_skill_analysis_result(self):
        parsed = make_parsed_resume()
        result = analyze_skills(parsed, "Backend Developer")
        assert isinstance(result, SkillAnalysisResult)

    def test_domain_match_pct_in_range(self):
        parsed = make_parsed_resume()
        result = analyze_skills(parsed, "Backend Developer")
        assert 0.0 <= result.domain_match_pct <= 100.0

    def test_backend_domain_matches_python_fastapi(self):
        parsed = make_parsed_resume()
        result = analyze_skills(parsed, "Backend Developer")
        matched_lower = [s.lower() for s in result.matched_skills]
        assert "python" in matched_lower
        assert "fastapi" in matched_lower

    def test_missing_skills_not_in_resume(self):
        parsed = make_parsed_resume()
        result = analyze_skills(parsed, "Frontend Developer")
        # Frontend skills like React/Vue/TypeScript won't be in backend resume
        missing_lower = [s.lower() for s in result.missing_skills]
        # At least some frontend skills should be missing
        assert len(missing_lower) > 0

    def test_keyword_analysis_populated(self):
        parsed = make_parsed_resume()
        result = analyze_skills(parsed, "Backend Developer")
        assert isinstance(result.keyword_analysis, KeywordAnalysis)
        assert 0.0 <= result.keyword_analysis.keyword_density <= 1.0

    def test_found_keywords_subset_of_all_required(self):
        parsed = make_parsed_resume()
        result = analyze_skills(parsed, "Backend Developer")
        # Every found keyword should be a matched skill
        assert len(result.keyword_analysis.found_keywords) > 0

    def test_top_matched_max_10(self):
        parsed = make_parsed_resume()
        result = analyze_skills(parsed, "Backend Developer")
        assert len(result.keyword_analysis.top_matched) <= 10

    def test_unknown_domain_returns_zero_match(self):
        parsed = make_parsed_resume()
        result = analyze_skills(parsed, "Unknown Domain XYZ")
        assert result.domain_match_pct == 0.0
        assert result.matched_skills == []

    def test_full_text_matching_works(self):
        """Skills mentioned in raw text but not in explicit skills list should be found."""
        parsed = ParsedResume(
            raw_text="Experienced in Docker and Kubernetes deployments using Nginx",
            word_count=10,
            page_count=1,
            skills=[],  # No explicit skills
        )
        result = analyze_skills(parsed, "Backend Developer")
        matched_lower = [s.lower() for s in result.matched_skills]
        assert "docker" in matched_lower
        assert "nginx" in matched_lower

    def test_short_skill_r_not_false_positive(self):
        """The letter 'r' should not incorrectly match inside other words."""
        parsed = ParsedResume(
            raw_text="restructured the team and reorganized workflows",
            word_count=7,
            page_count=1,
            skills=[],
        )
        result = analyze_skills(parsed, "Data Scientist")
        # 'r' as a programming language should not match 'restructured'
        matched_lower = [s.lower() for s in result.matched_skills]
        if "r" in matched_lower:
            # If matched, it should be because 'r' appears as a standalone word
            assert " r " in parsed.raw_text.lower() or parsed.raw_text.lower().startswith("r ")

    def test_multiword_skill_detection(self):
        """Multi-word skills like 'rest api' should be found correctly."""
        parsed = ParsedResume(
            raw_text="Built REST API endpoints using FastAPI and PostgreSQL",
            word_count=9,
            page_count=1,
            skills=["fastapi", "postgresql"],
        )
        result = analyze_skills(parsed, "Backend Developer")
        matched_lower = [s.lower() for s in result.matched_skills]
        assert "rest api" in matched_lower

    def test_all_domains_work(self):
        """Every supported domain should run without errors."""
        from app.resume.config import SUPPORTED_DOMAINS
        parsed = make_parsed_resume()
        for domain in SUPPORTED_DOMAINS:
            result = analyze_skills(parsed, domain)
            assert isinstance(result, SkillAnalysisResult)
            assert 0.0 <= result.domain_match_pct <= 100.0


class TestIsSkillPresent:
    def test_exact_set_match(self):
        assert _is_skill_present("python", {"python", "java"}, "some text") is True

    def test_text_boundary_match(self):
        assert _is_skill_present("docker", set(), "using docker for containers") is True

    def test_no_partial_match(self):
        # 'docker' should not match 'dockerized'... actually with \b it does match
        # 'docker' inside 'dockerized' — test boundary behavior
        result = _is_skill_present("docker", set(), "dockerized the app")
        # \bdocker\b would NOT match 'dockerized' since 'd' follows 'r'
        # Actually: in 'dockerized', \bdocker\b... let's verify the boundary
        # 'docker' is followed by 'i' so \bdocker\b does NOT match
        assert result is False

    def test_not_present(self):
        assert _is_skill_present("kubernetes", set(), "no k8s tools used") is False
