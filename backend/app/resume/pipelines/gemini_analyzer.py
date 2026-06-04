"""
app/resume/pipelines/gemini_analyzer.py
────────────────────────────────────────
Gemini AI analysis pipeline stage.

Sends a richly structured prompt to Gemini and requests a JSON-formatted
analysis containing:
  - ai_summary            : 3-paragraph narrative feedback
  - top_strengths         : list of 3 key strengths
  - top_improvements      : list of 3 actionable improvements
  - gemini_holistic_score : holistic placement readiness (0–100)

Includes retry logic (3 attempts, exponential backoff) and graceful fallback.
"""

from __future__ import annotations

import json
import logging
import asyncio
import re
from typing import Any, Dict, Optional

from app.resume.schemas import (
    ParsedResume,
    SkillAnalysisResult,
    ATSScoringResult,
    SemanticScoringResult,
    GeminiInsights,
)
from app.resume.utils.text_utils import clamp

logger = logging.getLogger("resume.pipelines.gemini_analyzer")

_MAX_RETRIES = 3
_RETRY_BASE_DELAY = 1.5  # seconds


# ─── Main Entry Point ─────────────────────────────────────────────────────────

async def analyze_with_gemini(
    gemini_model,
    parsed: ParsedResume,
    target_domain: str,
    skill_result: SkillAnalysisResult,
    ats_result: ATSScoringResult,
    semantic_result: SemanticScoringResult,
) -> GeminiInsights:
    """
    Call Gemini to generate AI-powered resume insights.

    Args:
        gemini_model:    Initialised google.generativeai.GenerativeModel
        parsed:          Structured ParsedResume
        target_domain:   Selected job domain
        skill_result:    Output from skill_analyzer
        ats_result:      Output from ats_scorer
        semantic_result: Output from semantic_scorer

    Returns:
        GeminiInsights (with graceful fallback on failure)
    """
    if gemini_model is None:
        logger.warning("Gemini model not available — returning fallback insights.")
        return _fallback_insights(ats_result, skill_result)

    prompt = _build_prompt(parsed, target_domain, skill_result, ats_result, semantic_result)

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            raw_response = await asyncio.to_thread(
                gemini_model.generate_content, prompt
            )
            text = raw_response.text.strip()
            parsed_json = _extract_json(text)
            insights = _parse_gemini_response(parsed_json, ats_result, skill_result)
            logger.info(f"Gemini analysis succeeded on attempt {attempt}.")
            return insights

        except Exception as exc:
            wait = _RETRY_BASE_DELAY * (2 ** (attempt - 1))
            logger.warning(f"Gemini attempt {attempt} failed: {exc}. Retrying in {wait:.1f}s...")
            if attempt < _MAX_RETRIES:
                await asyncio.sleep(wait)

    logger.error("All Gemini retry attempts exhausted — returning fallback insights.")
    return _fallback_insights(ats_result, skill_result)


# ─── Prompt Builder ───────────────────────────────────────────────────────────

def _build_prompt(
    parsed: ParsedResume,
    target_domain: str,
    skill_result: SkillAnalysisResult,
    ats_result: ATSScoringResult,
    semantic_result: SemanticScoringResult,
) -> str:
    """Build a concise, structured prompt for Gemini with all analysis context."""

    # Truncate resume text to keep prompt within token limits
    resume_excerpt = parsed.raw_text[:2500].strip()

    skills_found = ", ".join(skill_result.matched_skills[:15]) or "None detected"
    skills_missing = ", ".join(skill_result.missing_skills[:15]) or "None"
    weak_sections = ", ".join(ats_result.weak_sections[:5]) or "None"

    top_projects = []
    for pr in semantic_result.project_relevance[:3]:
        top_projects.append(f"  - {pr.project_name}: {pr.relevance_score:.2f} relevance")
    projects_summary = "\n".join(top_projects) or "  - No projects detected"

    prompt = f"""You are an expert resume reviewer and career coach specialising in tech hiring.

Analyse the following resume for a candidate targeting the role of **{target_domain}**.

## Resume Excerpt (first 2500 characters)
```
{resume_excerpt}
```

## Pre-computed Analysis Metrics
- ATS Score: {ats_result.ats_score:.1f}/100
- Domain Skill Match: {skill_result.domain_match_pct:.1f}%
- Semantic Match (vs domain JD): {semantic_result.semantic_match_score:.3f}
- Matched Skills: {skills_found}
- Missing Skills: {skills_missing}
- Weak Sections: {weak_sections}
- Top Project Relevance Scores:
{projects_summary}

## Task
Respond with ONLY a valid JSON object (no markdown, no extra text) with this exact schema:

{{
  "ai_summary": "<3 paragraph narrative: Para 1 = overall impression, Para 2 = specific strengths with examples, Para 3 = key improvement areas. Be specific, technical, and actionable. ~200 words total.>",
  "top_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "top_improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "gemini_holistic_score": <integer 0-100, holistic placement readiness estimate>
}}

Guidelines:
- Be direct and professional. Use technical vocabulary appropriate for {target_domain}.
- Strengths and improvements must be specific (not generic like "improve your resume").
- gemini_holistic_score should account for the pre-computed metrics AND your assessment of the resume excerpt.
- If the resume text is very sparse or unreadable, score conservatively (30–50 range).
"""

    return prompt


# ─── Response Parser ──────────────────────────────────────────────────────────

def _extract_json(text: str) -> Dict[str, Any]:
    """Extract JSON from Gemini response text, handling markdown code fences."""
    # Try to strip markdown ```json ... ``` or ``` ... ```
    json_match = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", text, re.DOTALL)
    if json_match:
        text = json_match.group(1)
    else:
        # Find the first { ... } block
        brace_match = re.search(r"\{.*\}", text, re.DOTALL)
        if brace_match:
            text = brace_match.group(0)

    return json.loads(text)


def _parse_gemini_response(
    data: Dict[str, Any],
    ats_result: ATSScoringResult,
    skill_result: SkillAnalysisResult,
) -> GeminiInsights:
    """Validate and construct GeminiInsights from parsed JSON."""
    ai_summary = str(data.get("ai_summary", "")).strip()
    top_strengths = [str(s) for s in data.get("top_strengths", [])][:3]
    top_improvements = [str(s) for s in data.get("top_improvements", [])][:3]

    raw_score = data.get("gemini_holistic_score", 50)
    try:
        gemini_score = clamp(float(raw_score), 0.0, 100.0)
    except (TypeError, ValueError):
        gemini_score = 50.0

    return GeminiInsights(
        ai_summary=ai_summary or _default_summary(ats_result, skill_result),
        top_strengths=top_strengths or _default_strengths(skill_result),
        top_improvements=top_improvements or _default_improvements(ats_result),
        gemini_holistic_score=round(gemini_score, 1),
    )


# ─── Fallback Helpers ─────────────────────────────────────────────────────────

def _fallback_insights(
    ats_result: ATSScoringResult,
    skill_result: SkillAnalysisResult,
) -> GeminiInsights:
    """Return rule-based insights when Gemini is unavailable."""
    return GeminiInsights(
        ai_summary=_default_summary(ats_result, skill_result),
        top_strengths=_default_strengths(skill_result),
        top_improvements=_default_improvements(ats_result),
        gemini_holistic_score=round(
            (ats_result.ats_score * 0.5 + skill_result.domain_match_pct * 0.5), 1
        ),
    )


def _default_summary(ats_result: ATSScoringResult, skill_result: SkillAnalysisResult) -> str:
    return (
        f"Your resume achieved an ATS score of {ats_result.ats_score:.0f}/100 and a domain "
        f"skill match of {skill_result.domain_match_pct:.0f}%. "
        f"Focus on addressing the missing skills and weak sections identified in this report "
        f"to improve your placement readiness."
    )


def _default_strengths(skill_result: SkillAnalysisResult) -> list:
    strengths = []
    if skill_result.matched_skills:
        strengths.append(f"Demonstrated proficiency in: {', '.join(skill_result.matched_skills[:4])}")
    if skill_result.domain_match_pct >= 60:
        strengths.append("Strong alignment with the target domain's core skill requirements")
    strengths.append("Resume structure covers key sections expected by recruiters")
    return strengths[:3]


def _default_improvements(ats_result: ATSScoringResult) -> list:
    improvements = []
    if ats_result.formatting_suggestions:
        improvements.extend(ats_result.formatting_suggestions[:2])
    if ats_result.weak_sections:
        improvements.append(f"Strengthen these sections: {', '.join(ats_result.weak_sections[:3])}")
    improvements.append("Add quantifiable achievements (metrics, percentages, impact numbers) to each experience entry")
    return improvements[:3]
