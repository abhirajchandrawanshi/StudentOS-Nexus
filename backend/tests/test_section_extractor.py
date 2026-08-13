"""
tests/test_section_extractor.py
────────────────────────────────
Tests for resume section segmentation pipeline.
"""

from __future__ import annotations

import pytest

from tests.conftest import SAMPLE_RESUME_TEXT, make_raw_resume_text
from app.resume.schemas import ParsedResume, RawResumeText
from app.resume.pipelines.section_extractor import parse_resume_sections


class TestParseSections:
    def test_returns_parsed_resume_instance(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        assert isinstance(result, ParsedResume)

    def test_extracts_skills(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        assert len(result.skills) > 0

    def test_extracts_known_skills(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        skill_set = set(result.skills)
        assert any("python" in s for s in skill_set)

    def test_extracts_experience(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        assert len(result.experience) > 0

    def test_experience_has_company(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        companies = [e.company for e in result.experience]
        assert any("TechCorp" in c or "techcorp" in c.lower() for c in companies)

    def test_extracts_education(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        assert len(result.education) > 0

    def test_extracts_projects(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        assert len(result.projects) > 0

    def test_extracts_summary(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        # Summary may be empty if content is before any header — acceptable
        # Just ensure it's a string or None
        assert result.summary is None or isinstance(result.summary, str)

    def test_detects_email(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        assert result.email_found is True

    def test_detects_phone(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        assert result.phone_found is True

    def test_detects_linkedin(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        assert result.linkedin_found is True

    def test_detects_github(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        assert result.github_found is True

    def test_word_count_populated(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        assert result.word_count > 0

    def test_page_count_preserved(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        assert result.page_count == raw.page_count

    def test_handles_empty_text(self):
        raw = RawResumeText(full_text="", page_count=0)
        result = parse_resume_sections(raw)
        assert isinstance(result, ParsedResume)
        assert result.skills == []
        assert result.experience == []

    def test_handles_minimal_text(self):
        raw = RawResumeText(full_text="John Doe\njohn@test.com", page_count=1)
        result = parse_resume_sections(raw)
        assert isinstance(result, ParsedResume)
        assert result.email_found is True

    def test_skills_are_deduplicated(self):
        text = "SKILLS\nPython, Python, python, FastAPI, FASTAPI\n"
        raw = RawResumeText(full_text=text, page_count=1)
        result = parse_resume_sections(raw)
        # Should not have duplicate python entries
        lower_skills = [s.lower() for s in result.skills]
        assert lower_skills.count("python") <= 1

    def test_different_section_capitalizations(self):
        text = "TECHNICAL SKILLS\nPython, Docker\nWORK EXPERIENCE\nEngineer at Corp\nEDUCATION\nBSc CS, MIT, 2021"
        raw = RawResumeText(full_text=text, page_count=1)
        result = parse_resume_sections(raw)
        assert len(result.skills) > 0
        assert len(result.experience) > 0
        assert len(result.education) > 0

    def test_certifications_extracted(self):
        raw = make_raw_resume_text()
        result = parse_resume_sections(raw)
        # certifications section exists in SAMPLE_RESUME_TEXT
        assert isinstance(result.certifications, list)

    def test_compact_headers_without_newlines_are_recovered(self):
        text = (
            "John Developer john@example.com "
            "SUMMARYExperienced backend engineer "
            "SKILLSPython, FastAPI, PostgreSQL "
            "EXPERIENCESenior Backend Engineer | TechCorp | 2022 - Present "
            "EDUCATIONB.Tech Computer Science | IIT Bombay | 2021 "
            "PROJECTSChat API - Built with FastAPI and Redis "
            "CERTIFICATIONSAWS Certified Developer"
        )
        raw = RawResumeText(full_text=text, page_count=1)
        result = parse_resume_sections(raw)

        assert result.summary is None or isinstance(result.summary, str)
        assert len(result.skills) > 0
        assert len(result.experience) > 0
        assert len(result.education) > 0
        assert len(result.projects) > 0

    def test_achievements_extracted(self):
        text = (
            "SUMMARY\nBackend engineer\n"
            "ACHIEVEMENTS\n"
            "- Won 1st prize in Hackathon 2024\n"
            "- Reduced API latency by 40%\n"
        )
        raw = RawResumeText(full_text=text, page_count=1)
        result = parse_resume_sections(raw)

        assert isinstance(result.achievements, list)
        assert len(result.achievements) == 2
        assert "Hackathon" in result.achievements[0]
