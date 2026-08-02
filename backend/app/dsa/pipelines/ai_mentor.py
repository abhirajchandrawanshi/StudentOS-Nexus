from __future__ import annotations

import asyncio
import json
import logging
import re
from typing import Any, Dict, List

logger = logging.getLogger("dsa.ai_mentor")


def _fallback_mentor(weak_topics: List[str], readiness: Dict[str, Any]) -> Dict[str, Any]:
    focus = weak_topics[:3] if weak_topics else ["Graphs", "DP"]
    return {
        "studyAdvice": f"Prioritize {', '.join(focus)} with daily timed problem solving and post-solution review.",
        "weeklyGoals": [
            "Complete 5 guided problems from weakest topic",
            "Do one 45-minute mock interview session",
            "Write revision notes for repeated mistakes",
        ],
        "interviewTips": [
            "State brute force first, then optimize with complexity tradeoffs",
            "Think aloud and verify edge cases before coding",
            "Practice clean function decomposition",
        ],
        "motivation": (
            f"Your current readiness is {readiness.get('score', 0)}. "
            "Steady consistency over 4-6 weeks will create visible placement gains."
        ),
        "source": "fallback",
    }


def _extract_json(text: str) -> Dict[str, Any]:
    fenced = re.search(r"```(?:json)?\\s*(\{.*?\})\\s*```", text, re.DOTALL)
    if fenced:
        text = fenced.group(1)
    else:
        brace = re.search(r"\{.*\}", text, re.DOTALL)
        if brace:
            text = brace.group(0)
    return json.loads(text)


async def generate_ai_mentor_guidance(
    *,
    gemini_model: Any,
    analytics: Dict[str, Any],
    weak_topics: List[str],
    roadmap: Dict[str, Any],
    readiness: Dict[str, Any],
) -> Dict[str, Any]:
    """Use Gemini only to generate explanations and advice. Never ask Gemini to score."""
    if gemini_model is None:
        return _fallback_mentor(weak_topics, readiness)

    prompt = f"""
You are an AI DSA mentor.
Important constraints:
- You MUST NOT calculate or modify readiness score.
- Use provided readiness score exactly as given.
- Return ONLY valid JSON with keys: studyAdvice, weeklyGoals, interviewTips, motivation.

Given Inputs:
- Analytics: {json.dumps(analytics)}
- Weak Topics: {json.dumps(weak_topics)}
- Roadmap: {json.dumps(roadmap)}
- Readiness: {json.dumps(readiness)}

Output schema:
{{
  "studyAdvice": "string",
  "weeklyGoals": ["string", "string", "string"],
  "interviewTips": ["string", "string", "string"],
  "motivation": "string"
}}
"""

    try:
        response = await asyncio.to_thread(gemini_model.generate_content, prompt)
        data = _extract_json(response.text.strip())
        return {
            "studyAdvice": str(data.get("studyAdvice", "")),
            "weeklyGoals": [str(x) for x in data.get("weeklyGoals", [])][:3],
            "interviewTips": [str(x) for x in data.get("interviewTips", [])][:3],
            "motivation": str(data.get("motivation", "")),
            "source": "gemini",
        }
    except Exception as exc:
        logger.warning("Gemini mentor generation failed: %s", exc)
        return _fallback_mentor(weak_topics, readiness)
