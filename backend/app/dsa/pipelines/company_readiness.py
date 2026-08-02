from __future__ import annotations

from typing import Any, Dict, List


def compute_company_readiness(
    *,
    analytics: Dict[str, Any],
    weak_topics: List[str],
) -> Dict[str, Any]:
    """Compute a 0-100 readiness score and an explanation from deterministic factors."""
    stats = analytics.get("stats", {})
    topic_rows = analytics.get("topics", [])

    if topic_rows:
        topic_coverage = sum((row.get("solved", 0) / max(1, row.get("total", 1))) for row in topic_rows) / len(topic_rows)
    else:
        topic_coverage = 0.0

    easy = float(stats.get("easy", 0))
    medium = float(stats.get("medium", 0))
    hard = float(stats.get("hard", 0))
    total = float(stats.get("all", 0))

    difficulty_coverage = (
        min(1.0, easy / 150.0) * 0.30
        + min(1.0, medium / 200.0) * 0.45
        + min(1.0, hard / 50.0) * 0.25
    )

    solved_count_score = min(1.0, total / 300.0)

    if total <= 0:
        consistency = 0.0
    else:
        advanced_ratio = (medium + hard) / max(1.0, total)
        consistency = min(1.0, 0.4 + advanced_ratio)

    weak_topic_penalty = min(0.35, len(weak_topics) * 0.06)

    score = (
        (topic_coverage * 100.0) * 0.35
        + (difficulty_coverage * 100.0) * 0.30
        + (solved_count_score * 100.0) * 0.20
        + (consistency * 100.0) * 0.15
    )
    score = score * (1.0 - weak_topic_penalty)
    score = max(0.0, min(100.0, round(score, 1)))

    factors = {
        "topic_coverage": round(topic_coverage * 100.0, 1),
        "difficulty_coverage": round(difficulty_coverage * 100.0, 1),
        "solved_count": int(total),
        "consistency": round(consistency * 100.0, 1),
        "weak_topics": weak_topics,
    }

    explanation = (
        f"Readiness is {score}/100 driven by topic coverage {factors['topic_coverage']}%, "
        f"difficulty coverage {factors['difficulty_coverage']}%, solved count {int(total)}, "
        f"and consistency {factors['consistency']}%."
    )

    return {
        "score": score,
        "explanation": explanation,
        "factors": factors,
    }
