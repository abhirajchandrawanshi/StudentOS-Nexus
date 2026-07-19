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
    ImprovementSuggestion,
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

    prompt = f"""You are a ruthless, highly critical, and unbiased senior technical recruiter and career coach.
Your job is to provide genuine, realistic feedback on this resume for a candidate targeting the role of **{target_domain}**.
DO NOT sugarcoat your feedback. If the resume is bad or generic, say so professionally. 

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
  "ai_summary": "<3 paragraph narrative: Para 1 = brutally honest overall impression, Para 2 = specific strengths, Para 3 = critical weaknesses. Be extremely specific to the text provided. ~200 words.>",
  "top_strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "top_improvements": [
    {{
      "original_text": "<exact weak phrase found in the resume excerpt>",
      "suggested_text": "<powerful, metric-driven replacement phrase>",
      "reasoning": "<why this improves ATS/Recruiter perception>"
    }},
    ... (provide exactly 3 improvements based on actual text from the excerpt)
  ],
  "gemini_holistic_score": <integer 0-100, holistic placement readiness estimate>
}}

Guidelines:
- Be direct, professional, and critical. Do not give generic praise.
- For `top_improvements`, you MUST pick real phrases from the resume excerpt and provide a concrete "Instead of this -> Do this" suggestion.
- gemini_holistic_score should account for the pre-computed metrics AND your harsh assessment of the resume excerpt.
- If the resume text lacks metrics or strong verbs, score it conservatively (30–50 range).
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
    
    raw_improvements = data.get("top_improvements", [])
    parsed_improvements = []
    if isinstance(raw_improvements, list):
        for imp in raw_improvements[:3]:
            if isinstance(imp, dict):
                parsed_improvements.append(ImprovementSuggestion(
                    original_text=str(imp.get("original_text", "Missing original text")),
                    suggested_text=str(imp.get("suggested_text", "Missing suggestion")),
                    reasoning=str(imp.get("reasoning", "Improves clarity and impact."))
                ))
    
    top_improvements = parsed_improvements

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
        improvements.append(ImprovementSuggestion(
            original_text="Current formatting issues detected",
            suggested_text=ats_result.formatting_suggestions[0],
            reasoning="ATS parsers struggle with non-standard formatting."
        ))
    if ats_result.weak_sections:
        improvements.append(ImprovementSuggestion(
            original_text="Weak or missing standard sections",
            suggested_text=f"Strengthen these sections: {', '.join(ats_result.weak_sections[:3])}",
            reasoning="Recruiters expect a standard resume structure."
        ))
    improvements.append(ImprovementSuggestion(
        original_text="Worked on tasks",
        suggested_text="Architected systems resulting in 40% performance gain",
        reasoning="Add quantifiable achievements (metrics, percentages) to each entry."
    ))
    return improvements[:3]


# ─── Rewrite Feature ─────────────────────────────────────────────────────────

async def rewrite_resume_with_gemini(
    gemini_model,
    raw_text: str,
    target_domain: str,
) -> str:
    """
    Call Gemini to rewrite the resume text for the target domain.
    Returns markdown text.
    """
    if gemini_model is None:
        raise ValueError("Gemini model is required for rewriting resumes.")

    prompt = f"""You are an expert resume writer and career coach specialising in tech hiring.

Please rewrite the following resume for a candidate targeting the role of **{target_domain}**.

## Original Resume Text
```
{raw_text}
```

## Task
Rewrite this resume to maximize ATS compatibility and impact for the {target_domain} role.
- Improve action verbs (e.g., use "Architected", "Engineered", "Spearheaded").
- Ensure standard sections are present (Summary, Experience, Education, Skills, Projects).
- Integrate keywords relevant to {target_domain} naturally into the experience and skills sections if the original text implies experience with them.
- Ensure quantifiable metrics are highlighted or phrased effectively.
- Return the fully rewritten resume in clean, professional Markdown format.

Do not include any introductory or concluding remarks. Just output the Markdown resume.
"""

    try:
        raw_response = await asyncio.to_thread(
            gemini_model.generate_content, prompt
        )
        text = raw_response.text.strip()
        
        # Remove any Markdown code block wrapping if Gemini adds it
        if text.startswith("```markdown"):
            text = text[len("```markdown"):].strip()
        if text.startswith("```"):
            text = text[3:].strip()
        if text.endswith("```"):
            text = text[:-3].strip()
            
        return text
    except Exception as exc:
        logger.error(f"Gemini rewrite failed: {exc}", exc_info=True)
        raise ValueError("Failed to rewrite resume using Gemini AI.")

