"""
tests/test_ats_scorer.py
─────────────────────────
Tests for the ATS compatibility scoring pipeline.
"""

from __future__ import annotations

import pytest

from tests.conftest import make_parsed_resume, make_skill_result
from app.resume.schemas import ATSScoringResult, ATSBreakdown, ParsedResume
from app.resume.pipelines.ats_scorer import score_ats


class TestScoreAts:
    def test_returns_ats_scoring_result(self):
        parsed = make_parsed_resume()
        skill = make_skill_result()
        result = score_ats(parsed, skill)
        assert isinstance(result, ATSScoringResult)

    def test_ats_score_in_range(self):
        parsed = make_parsed_resume()
        skill = make_skill_result()
        result = score_ats(parsed, skill)
        assert 0.0 <= result.ats_score <= 100.0

    def test_breakdown_scores_in_range(self):
        parsed = make_parsed_resume()
        skill = make_skill_result()
        result = score_ats(parsed, skill)
        bd = result.breakdown
        for score in [bd.keyword_score, bd.format_score, bd.length_score,
                      bd.section_completeness_score, bd.action_verbs_score]:
            assert 0.0 <= score <= 100.0

    def test_good_resume_scores_above_50(self):
        parsed = make_parsed_resume()
        skill = make_skill_result()
        result = score_ats(parsed, skill)
        assert result.ats_score >= 50.0

    def test_email_missing_reduces_format_score(self):
        parsed = make_parsed_resume()
        parsed.email_found = False
        skill = make_skill_result()
        result_no_email = score_ats(parsed, skill)

        parsed2 = make_parsed_resume()
        parsed2.email_found = True
        result_with_email = score_ats(parsed2, skill)

        assert result_with_email.breakdown.format_score >= result_no_email.breakdown.format_score

    def test_short_resume_reduces_length_score(self):
        parsed = make_parsed_resume()
        parsed.word_count = 50  # Very short
        skill = make_skill_result()
        result = score_ats(parsed, skill)
        assert result.breakdown.length_score < 100.0

    def test_long_resume_reduces_length_score(self):
        parsed = make_parsed_resume()
        parsed.word_count = 2000  # Too long
        skill = make_skill_result()
        result = score_ats(parsed, skill)
        assert result.breakdown.length_score < 100.0

    def test_ideal_word_count_gives_full_length_score(self):
        parsed = make_parsed_resume()
        parsed.word_count = 600  # Within 350-900 range
        skill = make_skill_result()
        result = score_ats(parsed, skill)
        assert result.breakdown.length_score == 100.0

    def test_action_verbs_detected(self):
        parsed = make_parsed_resume()
        # SAMPLE_RESUME_TEXT contains "Architected", "Optimised", "Implemented"
        skill = make_skill_result()
        result = score_ats(parsed, skill)
        assert result.breakdown.action_verbs_score > 0

    def test_weak_sections_is_list(self):
        parsed = make_parsed_resume()
        skill = make_skill_result()
        result = score_ats(parsed, skill)
        assert isinstance(result.weak_sections, list)

    def test_formatting_suggestions_is_list(self):
        parsed = make_parsed_resume()
        skill = make_skill_result()
        result = score_ats(parsed, skill)
        assert isinstance(result.formatting_suggestions, list)

    def test_formatting_suggestions_max_8(self):
        parsed = make_parsed_resume()
        skill = make_skill_result()
        result = score_ats(parsed, skill)
        assert len(result.formatting_suggestions) <= 8

    def test_empty_resume_does_not_crash(self):
        parsed = ParsedResume(raw_text="", word_count=0, page_count=0)
        skill = make_skill_result()
        result = score_ats(parsed, skill)
        assert isinstance(result, ATSScoringResult)
        assert 0.0 <= result.ats_score <= 100.0

    def test_score_is_deterministic(self):
        """Same input should always produce the same output."""
        parsed = make_parsed_resume()
        skill = make_skill_result()
        r1 = score_ats(parsed, skill)
        r2 = score_ats(parsed, skill)
        assert r1.ats_score == r2.ats_score
