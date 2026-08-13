"""
tests/test_text_utils.py
─────────────────────────
Unit tests for app/resume/utils/text_utils.py
"""

import pytest
from app.resume.utils.text_utils import (
    clamp,
    clean_skill,
    deduplicate_skills,
    detect_contact_info,
    extract_urls,
    normalise_text,
    split_into_lines,
    split_tech_tokens,
    strip_bullets,
    word_count,
)


# ─── normalise_text ───────────────────────────────────────────────────────────

class TestNormaliseText:
    def test_strips_control_characters(self):
        result = normalise_text("hello\x00world\x01")
        assert "\x00" not in result
        assert "\x01" not in result

    def test_collapses_multiple_spaces(self):
        result = normalise_text("hello   world")
        assert "hello world" in result

    def test_collapses_excessive_newlines(self):
        result = normalise_text("a\n\n\n\n\nb")
        assert "\n\n\n" not in result

    def test_normalises_unicode_dashes(self):
        result = normalise_text("2021\u20132022")  # en-dash
        assert "–" not in result
        assert "-" in result

    def test_normalises_smart_quotes(self):
        result = normalise_text("\u201cHello\u201d")
        assert '"Hello"' in result

    def test_preserves_newlines(self):
        result = normalise_text("line1\nline2")
        assert "\n" in result

    def test_empty_string(self):
        assert normalise_text("") == ""


# ─── clean_skill ─────────────────────────────────────────────────────────────

class TestCleanSkill:
    def test_lowercases(self):
        assert clean_skill("Python") == "python"

    def test_strips_whitespace(self):
        assert clean_skill("  react  ") == "react"

    def test_preserves_cpp(self):
        result = clean_skill("C++")
        assert "c++" == result

    def test_preserves_csharp(self):
        result = clean_skill("C#")
        assert "c#" == result

    def test_preserves_nodejs(self):
        result = clean_skill("Node.js")
        assert "node.js" == result

    def test_strips_stray_commas(self):
        result = clean_skill("python,")
        # comma is stripped by the regex [^\w\s./#+\-]
        assert "," not in result

    def test_collapses_inner_spaces(self):
        result = clean_skill("machine  learning")
        assert result == "machine learning"

    def test_empty_string(self):
        assert clean_skill("") == ""


# ─── deduplicate_skills ───────────────────────────────────────────────────────

class TestDeduplicateSkills:
    def test_removes_duplicates(self):
        result = deduplicate_skills(["Python", "python", "PYTHON"])
        assert len(result) == 1

    def test_preserves_order(self):
        result = deduplicate_skills(["React", "Node.js", "React", "TypeScript"])
        assert result.index("react") < result.index("node.js")

    def test_filters_empty(self):
        result = deduplicate_skills(["", "  ", "python"])
        assert "" not in result
        assert "python" in result

    def test_empty_list(self):
        assert deduplicate_skills([]) == []


# ─── detect_contact_info ─────────────────────────────────────────────────────

class TestDetectContactInfo:
    def test_detects_email(self):
        info = detect_contact_info("Contact: john@example.com")
        assert info["email_found"] is True

    def test_detects_phone(self):
        info = detect_contact_info("+1-555-123-4567")
        assert info["phone_found"] is True

    def test_detects_linkedin(self):
        info = detect_contact_info("linkedin.com/in/johndoe")
        assert info["linkedin_found"] is True

    def test_detects_github(self):
        info = detect_contact_info("github.com/johndoe")
        assert info["github_found"] is True

    def test_all_false_when_absent(self):
        info = detect_contact_info("No contact info here.")
        assert not any(info.values())

    def test_all_present(self):
        text = "john@example.com | +1-555-123-4567 | linkedin.com/in/john | github.com/john"
        info = detect_contact_info(text)
        assert all(info.values())


# ─── word_count ───────────────────────────────────────────────────────────────

class TestWordCount:
    def test_basic_count(self):
        assert word_count("hello world foo") == 3

    def test_empty_string(self):
        assert word_count("") == 0

    def test_single_word(self):
        assert word_count("python") == 1


# ─── strip_bullets ────────────────────────────────────────────────────────────

class TestStripBullets:
    def test_removes_dash_bullet(self):
        assert strip_bullets("- Built API") == "Built API"

    def test_removes_unicode_bullet(self):
        assert strip_bullets("• Designed system") == "Designed system"

    def test_removes_asterisk(self):
        assert strip_bullets("* Deployed service") == "Deployed service"

    def test_no_bullet(self):
        assert strip_bullets("Led team") == "Led team"

    def test_empty(self):
        assert strip_bullets("") == ""


# ─── split_into_lines ────────────────────────────────────────────────────────

class TestSplitIntoLines:
    def test_basic_split(self):
        lines = split_into_lines("line1\nline2\nline3")
        assert lines == ["line1", "line2", "line3"]

    def test_filters_empty_lines(self):
        lines = split_into_lines("line1\n\n\nline2")
        assert "" not in lines
        assert len(lines) == 2

    def test_strips_whitespace(self):
        lines = split_into_lines("  line1  \n  line2  ")
        assert lines == ["line1", "line2"]

    def test_empty_string(self):
        assert split_into_lines("") == []


# ─── extract_urls ─────────────────────────────────────────────────────────────

class TestExtractUrls:
    def test_extracts_http_url(self):
        urls = extract_urls("Visit https://example.com for details")
        assert "https://example.com" in urls

    def test_extracts_www_url(self):
        urls = extract_urls("See www.example.com")
        assert "www.example.com" in urls

    def test_no_urls(self):
        assert extract_urls("No links here") == []

    def test_multiple_urls(self):
        text = "https://github.com/user https://linkedin.com/in/user"
        urls = extract_urls(text)
        assert len(urls) == 2


# ─── split_tech_tokens ───────────────────────────────────────────────────────

class TestSplitTechTokens:
    def test_comma_separated(self):
        result = split_tech_tokens("Python, FastAPI, PostgreSQL")
        assert "Python" in result
        assert "FastAPI" in result
        assert "PostgreSQL" in result

    def test_pipe_separated(self):
        result = split_tech_tokens("React | Vue | Angular")
        assert "React" in result

    def test_bullet_separated(self):
        result = split_tech_tokens("Docker • Kubernetes • Helm")
        assert "Docker" in result

    def test_filters_single_chars(self):
        result = split_tech_tokens("a, Python, b")
        assert "a" not in result
        assert "b" not in result

    def test_empty_string(self):
        assert split_tech_tokens("") == []


# ─── clamp ────────────────────────────────────────────────────────────────────

class TestClamp:
    def test_within_range(self):
        assert clamp(50.0) == 50.0

    def test_below_min(self):
        assert clamp(-10.0) == 0.0

    def test_above_max(self):
        assert clamp(150.0) == 100.0

    def test_at_boundaries(self):
        assert clamp(0.0) == 0.0
        assert clamp(100.0) == 100.0

    def test_custom_range(self):
        assert clamp(0.5, 0.0, 1.0) == 0.5
        assert clamp(1.5, 0.0, 1.0) == 1.0
        assert clamp(-0.5, 0.0, 1.0) == 0.0
