"""
app/resume/pipelines/skill_analyzer.py
───────────────────────────────────────
Domain skill gap and keyword analysis pipeline stage.

Given a ParsedResume and a target domain, computes:
  - domain_match_pct    : % of required domain skills found in resume
  - missing_skills      : required skills not found
  - keyword_analysis    : keyword density, found/missing keyword lists
"""

from __future__ import annotations

import logging
import re
from typing import List, Set

from app.resume.config import DOMAIN_SKILL_MAP
from app.resume.schemas import (
    ParsedResume,
    SkillAnalysisResult,
    KeywordAnalysis,
)
from app.resume.utils.text_utils import clean_skill, clamp

logger = logging.getLogger("resume.pipelines.skill_analyzer")


def analyze_skills(parsed: ParsedResume, target_domain: str) -> SkillAnalysisResult:
    """
    Main entry point for skill gap analysis.

    Args:
        parsed: Structured ParsedResume from section_extractor
        target_domain: One of the keys in DOMAIN_SKILL_MAP

    Returns:
        SkillAnalysisResult with match percentage, missing skills, and keyword analysis
    """
    domain_map = DOMAIN_SKILL_MAP.get(target_domain)
    if not domain_map:
        logger.warning(f"Unknown domain '{target_domain}' — using empty skill map.")
        domain_map = {"core": [], "tools": [], "soft_signals": []}

    # Build flat required skills lists
    core_required: List[str] = [clean_skill(s) for s in domain_map.get("core", [])]
    tools_required: List[str] = [clean_skill(s) for s in domain_map.get("tools", [])]
    soft_required: List[str]  = [clean_skill(s) for s in domain_map.get("soft_signals", [])]
    all_required: List[str]   = core_required + tools_required + soft_required

    # Build candidate skill set from the parsed resume
    # Include: explicit skills + technologies from projects and experience
    candidate_skills: Set[str] = set()
    for s in parsed.skills:
        candidate_skills.add(clean_skill(s))
    for proj in parsed.projects:
        for t in proj.technologies:
            candidate_skills.add(clean_skill(t))
    for exp in parsed.experience:
        for t in exp.technologies:
            candidate_skills.add(clean_skill(t))

    # Full text (lowercase) for keyword density search
    full_text_lower = parsed.raw_text.lower()

    # ── Match detection ────────────────────────────────────────────────────────
    # A skill is "matched" if:
    #   a) It appears in the candidate set (exact clean match), OR
    #   b) It appears as a substring in the full resume text

    matched: List[str] = []
    missing: List[str] = []

    for skill in all_required:
        if _is_skill_present(skill, candidate_skills, full_text_lower):
            matched.append(skill)
        else:
            missing.append(skill)

    # ── Domain match percentage ────────────────────────────────────────────────
    total_required = len(all_required)
    domain_match_pct = clamp(
        (len(matched) / total_required * 100) if total_required > 0 else 0.0,
        0.0, 100.0
    )

    # ── Keyword density ────────────────────────────────────────────────────────
    # Count unique domain keywords appearing in the full text
    total_words = max(len(full_text_lower.split()), 1)
    keyword_occurrences = _count_keyword_occurrences(all_required, full_text_lower)
    keyword_density = clamp(len([k for k, c in keyword_occurrences.items() if c > 0]) / total_required, 0.0, 1.0) if total_required else 0.0

    # Top 10 most-mentioned keywords
    top_matched = sorted(
        [(k, c) for k, c in keyword_occurrences.items() if c > 0],
        key=lambda x: x[1],
        reverse=True
    )[:10]

    keyword_analysis = KeywordAnalysis(
        found_keywords=matched,
        missing_keywords=missing,
        keyword_density=round(keyword_density, 4),
        top_matched=[k for k, _ in top_matched],
    )

    logger.info(
        f"Skill analysis [{target_domain}]: "
        f"matched={len(matched)}/{total_required} ({domain_match_pct:.1f}%)"
    )

    return SkillAnalysisResult(
        domain_match_pct=round(domain_match_pct, 2),
        matched_skills=matched,
        missing_skills=missing,
        keyword_analysis=keyword_analysis,
    )


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _is_skill_present(skill: str, candidate_set: Set[str], full_text: str) -> bool:
    """
    Check if a skill token is present in the resume.
    Uses both exact set membership and substring regex search.
    """
    if skill in candidate_set:
        return True

    # Regex word-boundary check in full text (handles multi-word skills like "node.js")
    pattern = re.escape(skill)
    try:
        return bool(re.search(r"\b" + pattern + r"\b", full_text))
    except re.error:
        return skill in full_text


def _count_keyword_occurrences(keywords: List[str], text: str) -> dict:
    """Count how many times each keyword appears in the text."""
    counts = {}
    for kw in keywords:
        pattern = re.escape(kw)
        try:
            matches = re.findall(r"\b" + pattern + r"\b", text)
            counts[kw] = len(matches)
        except re.error:
            counts[kw] = text.count(kw)
    return counts
