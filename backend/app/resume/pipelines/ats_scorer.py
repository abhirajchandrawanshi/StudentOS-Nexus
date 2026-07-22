"""
app/resume/pipelines/ats_scorer.py
───────────────────────────────────
ATS (Applicant Tracking System) compatibility scoring pipeline stage.

Rule-based, fast, no ML required. Scores 5 dimensions:
  - keyword_score        (30%) : domain keyword presence rate
  - format_score         (25%) : structure/contact/header quality
  - length_score         (20%) : word count in ideal range
  - section_completeness (15%) : all 5 major sections present
  - action_verbs_score   (10%) : strong action verbs in bullet points

Returns ATSScoringResult with overall score, breakdown, weak sections, and suggestions.
"""

from __future__ import annotations

import re
import logging
from typing import List, Set

from app.resume.config import (
    ATS_WEIGHTS,
    ACTION_VERBS,
    IDEAL_WORD_COUNT_MIN,
    IDEAL_WORD_COUNT_MAX,
    SECTION_PATTERNS,
)
from app.resume.schemas import (
    ParsedResume,
    SkillAnalysisResult,
    ATSScoringResult,
    ATSBreakdown,
)
from app.resume.utils.text_utils import clamp, split_into_lines, strip_bullets

logger = logging.getLogger("resume.pipelines.ats_scorer")

# Required sections for completeness check
_REQUIRED_SECTIONS = ["skills", "experience", "education", "projects", "certifications"]

# Compiled section header patterns for presence detection
_SECTION_COMPILED = {
    section: [re.compile(p, re.IGNORECASE) for p in patterns]
    for section, patterns in SECTION_PATTERNS.items()
}

# Compiled action verbs (word boundary)
_ACTION_VERB_RE = re.compile(
    r"\b(" + "|".join(re.escape(v) for v in ACTION_VERBS) + r")\b",
    re.IGNORECASE,
)


# ─── Main Entry Point ─────────────────────────────────────────────────────────

def score_ats(
    parsed: ParsedResume,
    skill_result: SkillAnalysisResult,
) -> ATSScoringResult:
    """
    Compute ATS compatibility score and actionable suggestions.

    Args:
        parsed:       Structured ParsedResume
        skill_result: Output of skill_analyzer (for keyword density)

    Returns:
        ATSScoringResult
    """
    text = parsed.raw_text

    # ── 1. Keyword Score (30%) ────────────────────────────────────────────────
    keyword_score = clamp(skill_result.keyword_analysis.keyword_density * 100)

    # ── 2. Format Score (25%) ────────────────────────────────────────────────
    format_score, format_issues = _score_format(parsed, text)

    # ── 3. Length Score (20%) ────────────────────────────────────────────────
    length_score, length_issues = _score_length(parsed.word_count)

    # ── 4. Section Completeness (15%) ────────────────────────────────────────
    section_score, missing_sections = _score_section_completeness(text)

    # ── 5. Action Verbs (10%) ────────────────────────────────────────────────
    action_score, verb_issues = _score_action_verbs(text, parsed)

    # ── Weighted composite ATS score ──────────────────────────────────────────
    ats_score = clamp(
        keyword_score       * ATS_WEIGHTS["keyword_score"]
        + format_score      * ATS_WEIGHTS["format_score"]
        + length_score      * ATS_WEIGHTS["length_score"]
        + section_score     * ATS_WEIGHTS["section_completeness"]
        + action_score      * ATS_WEIGHTS["action_verbs_score"]
    )

    # ── Aggregate weak sections and suggestions ───────────────────────────────
    weak_sections: List[str] = list(missing_sections)
    formatting_suggestions: List[str] = []

    if keyword_score < 40:
        weak_sections.append("skills (low keyword match)")
        formatting_suggestions.append(
            "Add more domain-specific keywords to your Skills section to pass ATS filters."
        )
    if format_score < 60:
        formatting_suggestions.extend(format_issues)
    if length_score < 60:
        formatting_suggestions.extend(length_issues)
    if action_score < 50:
        formatting_suggestions.extend(verb_issues)

    logger.info(
        f"ATS Score: {ats_score:.1f} | "
        f"kw={keyword_score:.0f} fmt={format_score:.0f} "
        f"len={length_score:.0f} sec={section_score:.0f} verb={action_score:.0f}"
    )

    return ATSScoringResult(
        ats_score=round(ats_score, 2),
        breakdown=ATSBreakdown(
            keyword_score=round(keyword_score, 2),
            format_score=round(format_score, 2),
            length_score=round(length_score, 2),
            section_completeness_score=round(section_score, 2),
            action_verbs_score=round(action_score, 2),
        ),
        weak_sections=weak_sections,
        formatting_suggestions=formatting_suggestions[:8],  # cap at 8 suggestions
    )


# ─── Scoring Helpers ──────────────────────────────────────────────────────────

def _score_format(parsed: ParsedResume, text: str):
    """
    Evaluate formatting quality signals.
    Returns (score 0-100, list of improvement suggestions).
    """
    score = 100.0
    issues: List[str] = []

    # Contact info (deduct if missing)
    if not parsed.email_found:
        score -= 20
        issues.append("Add your email address — many ATS systems require it.")
    if not parsed.phone_found:
        score -= 10
        issues.append("Include a phone number for recruiter contact.")

    # LinkedIn / GitHub bonuses
    if not parsed.linkedin_found:
        score -= 5
        issues.append("Add your LinkedIn profile URL to improve recruiter visibility.")
    if not parsed.github_found and _is_tech_resume(text):
        issues.append("Consider adding your GitHub profile URL to showcase your code.")

    # Detect tables (ATS parsers often fail on tables)
    if _contains_table_markers(text):
        score -= 15
        issues.append(
            "Avoid tables and columns — many ATS parsers cannot read them correctly. "
            "Use plain text sections instead."
        )

    # Detect images/logos (usually placeholder text like "[IMAGE]" in extracted text)
    if re.search(r"\[image\]|\[photo\]|\[logo\]", text, re.IGNORECASE):
        score -= 10
        issues.append("Remove images/logos — ATS systems cannot parse visual elements.")

    # Detect use of symbols as section dividers (good practice)
    has_clear_headers = _has_clear_section_headers(text)
    if not has_clear_headers:
        score -= 10
        issues.append(
            "Use clear, capitalised section headers (e.g. EXPERIENCE, SKILLS) "
            "so ATS can parse your resume correctly."
        )

    return clamp(score), issues


def _score_length(word_count: int):
    """Score based on word count being within ideal range."""
    issues: List[str] = []
    if word_count < IDEAL_WORD_COUNT_MIN:
        score = clamp((word_count / IDEAL_WORD_COUNT_MIN) * 70)
        issues.append(
            f"Your resume is too short ({word_count} words). "
            f"Aim for {IDEAL_WORD_COUNT_MIN}–{IDEAL_WORD_COUNT_MAX} words."
        )
    elif word_count > IDEAL_WORD_COUNT_MAX:
        excess = word_count - IDEAL_WORD_COUNT_MAX
        penalty = min(excess / 200 * 10, 40)
        score = clamp(100 - penalty)
        issues.append(
            f"Your resume is too long ({word_count} words). "
            f"Condense to {IDEAL_WORD_COUNT_MAX} words for better ATS performance."
        )
    else:
        score = 100.0

    return score, issues


def _score_section_completeness(text: str):
    """Check whether all required sections are present."""
    missing: List[str] = []
    text_lower = text.lower()

    for section in _REQUIRED_SECTIONS:
        patterns = _SECTION_COMPILED.get(section, [])
        found = any(pat.search(text_lower) for pat in patterns)
        if not found:
            missing.append(section)

    present = len(_REQUIRED_SECTIONS) - len(missing)
    score = clamp((present / len(_REQUIRED_SECTIONS)) * 100)

    missing_labels = [f"Missing section: {s.capitalize()}" for s in missing]
    return score, missing_labels


def _score_action_verbs(text: str, parsed: ParsedResume):
    """
    Score the use of strong action verbs in experience/project descriptions.
    """
    issues: List[str] = []

    # Collect all bullet-like lines from experience + projects
    bullet_lines: List[str] = []
    for exp in parsed.experience:
        if exp.description:
            bullet_lines.extend(split_into_lines(exp.description))
    for proj in parsed.projects:
        if proj.description:
            bullet_lines.extend(split_into_lines(proj.description))

    if not bullet_lines:
        # Fall back to raw text
        bullet_lines = split_into_lines(text)

    total_bullets = len(bullet_lines)
    if total_bullets == 0:
        return 50.0, issues

    verbed_count = sum(
        1 for line in bullet_lines
        if _ACTION_VERB_RE.search(strip_bullets(line).split()[0] if strip_bullets(line).split() else "")
    )

    # Also count overall action verb mentions
    total_verb_matches = len(_ACTION_VERB_RE.findall(text))

    if total_verb_matches < 5:
        issues.append(
            "Use strong action verbs (e.g. Built, Designed, Optimised) "
            "to start each bullet point in Experience and Projects sections."
        )
        score = clamp(total_verb_matches / 5 * 60)
    elif total_verb_matches < 10:
        score = 75.0
    else:
        score = 100.0

    return score, issues


# ─── Utility Detectors ────────────────────────────────────────────────────────

def _contains_table_markers(text: str) -> bool:
    """Heuristic: detect table-like content (multiple pipe separators per line)."""
    lines = text.splitlines()
    table_lines = sum(1 for l in lines if l.count("|") >= 2)
    return table_lines > 3


def _has_clear_section_headers(text: str) -> bool:
    """Check if at least 3 common section headers are detected in the text."""
    found = 0
    text_lower = text.lower()
    for patterns in _SECTION_COMPILED.values():
        if any(p.search(text_lower) for p in patterns):
            found += 1
    return found >= 3


def _is_tech_resume(text: str) -> bool:
    """Heuristic: does this look like a tech resume?"""
    tech_signals = ["python", "java", "javascript", "react", "node", "github", "git", "api", "docker"]
    text_lower = text.lower()
    return sum(1 for s in tech_signals if s in text_lower) >= 3
