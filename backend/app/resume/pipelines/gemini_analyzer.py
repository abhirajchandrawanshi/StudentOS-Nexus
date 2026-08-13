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
import os
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

    gemini_model is the Google GenAI client returned by
    get_gemini_client().
    """

    if gemini_model is None:
        logger.warning(
            "Gemini client not available — returning fallback insights."
        )
        return _fallback_insights(ats_result, skill_result)

    prompt = _build_prompt(
        parsed,
        target_domain,
        skill_result,
        ats_result,
        semantic_result,
    )

    model_name = os.getenv(
        "GEMINI_MODEL",
        "gemini-3.6-flash",
    ).strip()

    for attempt in range(1, _MAX_RETRIES + 1):
        try:
            raw_response = await asyncio.to_thread(
                gemini_model.models.generate_content,
                model=model_name,
                contents=prompt,
            )

            text = (raw_response.text or "").strip()

            parsed_json = _extract_json(text)

            insights = _parse_gemini_response(
                parsed_json,
                ats_result,
                skill_result,
            )

            logger.info(
                "Gemini analysis succeeded on attempt %s.",
                attempt,
            )

            return insights

        except Exception as exc:
            wait = _RETRY_BASE_DELAY * (2 ** (attempt - 1))

            logger.warning(
                "Gemini attempt %s failed: %s. "
                "Retrying in %.1fs...",
                attempt,
                exc,
                wait,
            )

            if attempt < _MAX_RETRIES:
                await asyncio.sleep(wait)

    logger.error(
        "All Gemini retry attempts exhausted — "
        "returning fallback insights."
    )

    return _fallback_insights(
        ats_result,
        skill_result,
    )


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
DO NOT sugarcoat your feedback. If the resume is bad or generic, say so professionally. IMPORTANT FACTUALITY RULES:

IMPORTANT FACTUALITY RULES:

1. Use ONLY information explicitly present in the provided resume.
2. NEVER invent metrics, percentages, technologies, frameworks, libraries,
   certifications, job titles, responsibilities, dates, achievements, or
   project details.
3. NEVER infer a technology from a generic phrase.
   For example:
   - "machine learning" does NOT mean Python, PyTorch, TensorFlow,
     Scikit-learn, NumPy, or Pandas.
   - "vision and AI" does NOT mean OpenCV, YOLO, CNN, TensorFlow,
     PyTorch, or any specific computer vision model.
   - "edge AI" does NOT mean a specific model, framework, or optimization.
4. If a technology is not explicitly mentioned in the resume, describe it
   only as a RECOMMENDATION, never as an existing skill.
5. Suggested resume rewrites must preserve the factual meaning of the
   original text.
6. Do not add technologies to rewritten bullets unless those technologies
   already appear in the original resume.
7. Do not create performance metrics. If metrics are missing, recommend that
   the candidate add VERIFIED metrics if they have them.
8. Clearly distinguish between:
   - FACTS: explicitly present in the resume.
   - RECOMMENDATIONS: things the candidate could add or improve.
9. Never present a recommendation as an existing candidate skill,
   technology, achievement, or experience.
10. When information is missing, say it is missing instead of guessing.
For every suggested_text field:
- Rewrite only what is supported by the original_text.
- You may improve grammar, clarity, structure, and impact.
- You may NOT introduce new technologies, tools, models, metrics, or claims.
- If additional information would improve the bullet, explicitly recommend
  adding verified information rather than inserting it.

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
  "gemini_holistic_score": <integer 0-100, holistic placement readiness estimate>,
  "placement_readiness_level": "<one of: Ready | Almost Ready | Needs Work | Not Ready>",
  "learning_roadmap": ["<step 1 to close skill gaps>", "<step 2>", "<step 3>", "<step 4>"],
  "missing_competencies": ["<key missing competency 1>", "<key missing competency 2>", "<key missing competency 3>"]
}}

Guidelines:
- Be direct, professional, and critical. Do not give generic praise.
- For `top_improvements`, you MUST pick real phrases from the resume excerpt and provide a concrete "Instead of this -> Do this" suggestion.
- gemini_holistic_score should account for the pre-computed metrics AND your harsh assessment of the resume excerpt.
- If the resume text lacks metrics or strong verbs, score it conservatively (30–50 range).
- placement_readiness_level: Ready = score 80+, Almost Ready = 60-79, Needs Work = 40-59, Not Ready = <40.
- learning_roadmap: specific actionable steps to close the missing skill gaps for {target_domain}.
- missing_competencies: derive from Missing Skills but phrase them as competency areas, not just tool names.
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

    raw_score = data.get("gemini_holistic_score", 50)
    try:
        gemini_score = clamp(float(raw_score), 0.0, 100.0)
    except (TypeError, ValueError):
        gemini_score = 50.0

    # Derive placement_readiness_level from score if Gemini didn't provide it
    raw_level = str(data.get("placement_readiness_level", "")).strip()
    valid_levels = {"Ready", "Almost Ready", "Needs Work", "Not Ready"}
    if raw_level not in valid_levels:
        raw_level = _score_to_readiness_level(gemini_score)

    learning_roadmap = [str(s) for s in data.get("learning_roadmap", [])][:6]
    missing_competencies = [str(s) for s in data.get("missing_competencies", [])][:8]

    # Fall back to rule-based values if Gemini didn't return them
    if not learning_roadmap:
        learning_roadmap = _default_roadmap(skill_result)
    if not missing_competencies:
        missing_competencies = skill_result.missing_skills[:8]

    return GeminiInsights(
        ai_summary=ai_summary or _default_summary(ats_result, skill_result),
        top_strengths=top_strengths or _default_strengths(skill_result),
        top_improvements=parsed_improvements or _default_improvements(ats_result),
        gemini_holistic_score=round(gemini_score, 1),
        placement_readiness_level=raw_level,
        learning_roadmap=learning_roadmap,
        missing_competencies=missing_competencies,
    )


# ─── Fallback Helpers ─────────────────────────────────────────────────────────

def _fallback_insights(
    ats_result: ATSScoringResult,
    skill_result: SkillAnalysisResult,
) -> GeminiInsights:
    """Return rule-based insights when Gemini is unavailable."""
    score = round((ats_result.ats_score * 0.5 + skill_result.domain_match_pct * 0.5), 1)
    return GeminiInsights(
        ai_summary=_default_summary(ats_result, skill_result),
        top_strengths=_default_strengths(skill_result),
        top_improvements=_default_improvements(ats_result),
        gemini_holistic_score=score,
        placement_readiness_level=_score_to_readiness_level(score),
        learning_roadmap=_default_roadmap(skill_result),
        missing_competencies=skill_result.missing_skills[:8],
    )


def _score_to_readiness_level(score: float) -> str:
    """Convert a numeric score to a placement readiness label."""
    if score >= 80:
        return "Ready"
    elif score >= 60:
        return "Almost Ready"
    elif score >= 40:
        return "Needs Work"
    return "Not Ready"


def _default_roadmap(skill_result: SkillAnalysisResult) -> list:
    """Build a generic learning roadmap from missing skills."""
    roadmap = []
    if skill_result.missing_skills:
        top_missing = skill_result.missing_skills[:4]
        for skill in top_missing:
            roadmap.append(f"Learn and practise {skill} through hands-on projects or online courses.")
    roadmap.append("Build at least 2 portfolio projects showcasing the target domain's core technologies.")
    roadmap.append("Earn a recognised certification in the target domain to validate your skills.")
    return roadmap[:6]


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
        return _rewrite_markdown_fallback(raw_text, target_domain)


def _rewrite_markdown_fallback(raw_text: str, target_domain: str) -> str:
    """
    Build a safe Markdown rewrite from parsed content when Gemini is unavailable.
    Does not invent information; it only reorganises extracted resume data.
    """
    from app.resume.schemas import RawResumeText
    from app.resume.pipelines.section_extractor import parse_resume_sections

    parsed = parse_resume_sections(RawResumeText(full_text=raw_text, page_count=1))

    lines: list[str] = []
    lines.append(f"# Resume ({target_domain})")
    lines.append("")

    lines.append("## Summary")
    lines.append(parsed.summary.strip() if parsed.summary else "Summary not clearly extracted from the source PDF.")
    lines.append("")

    lines.append("## Skills")
    if parsed.skills:
        lines.append(", ".join(parsed.skills))
    else:
        lines.append("Skills section could not be reliably extracted.")
    lines.append("")

    lines.append("## Experience")
    if parsed.experience:
        for exp in parsed.experience:
            header_parts = [p for p in [exp.role, exp.company, exp.duration] if p]
            lines.append(f"- {' | '.join(header_parts)}")
            if exp.description:
                lines.append(f"  - {exp.description}")
    else:
        lines.append("- Experience section could not be reliably extracted.")
    lines.append("")

    lines.append("## Education")
    if parsed.education:
        for edu in parsed.education:
            parts = [p for p in [edu.degree, edu.field, edu.institution, edu.year] if p]
            lines.append(f"- {' | '.join(parts) if parts else edu.institution}")
    else:
        lines.append("- Education section could not be reliably extracted.")
    lines.append("")

    lines.append("## Projects")
    if parsed.projects:
        for proj in parsed.projects:
            lines.append(f"- {proj.name}")
            if proj.description:
                lines.append(f"  - {proj.description}")
            if proj.technologies:
                lines.append(f"  - Technologies: {', '.join(proj.technologies)}")
            if proj.url:
                lines.append(f"  - URL: {proj.url}")
    else:
        lines.append("- Projects section could not be reliably extracted.")
    lines.append("")

    lines.append("## Certifications")
    if parsed.certifications:
        for cert in parsed.certifications:
            bits = [p for p in [cert.name, cert.issuer, cert.year] if p]
            lines.append(f"- {' | '.join(bits)}")
    else:
        lines.append("- Certifications section not found.")
    lines.append("")

    lines.append("## Achievements")
    if parsed.achievements:
        for item in parsed.achievements:
            lines.append(f"- {item}")
    else:
        lines.append("- Achievements section not found.")

    return "\n".join(lines).strip() + "\n"

