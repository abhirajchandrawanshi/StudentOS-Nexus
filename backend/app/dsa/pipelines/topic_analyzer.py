from __future__ import annotations

from typing import Any, Dict, List


def analyze_topics(
    analytics_output: Dict[str, Any],
    company_topics: Dict[str, Any],
) -> Dict[str, Any]:
    """Analyze strong/weak/missing topics and produce normalized topic scores."""
    topic_rows = analytics_output.get("topics", [])
    company_weights = company_topics.get("topic_weights", {})

    topic_scores: List[Dict[str, Any]] = []

    for row in topic_rows:
        topic = row.get("topic", "")
        solved = int(row.get("solved", 0))
        total = max(1, int(row.get("total", 1)))
        coverage_pct = round((solved / total) * 100.0, 1)

        company_weight = float(company_weights.get(topic, 0))
        company_weight_norm = (company_weight / 40.0) * 100.0 if company_weight > 0 else 0.0

        composite_score = round((0.7 * coverage_pct) + (0.3 * company_weight_norm), 1)

        topic_scores.append(
            {
                "topic": topic,
                "coverage_pct": coverage_pct,
                "company_weight": round(company_weight, 1),
                "score": composite_score,
            }
        )

    strong_topics = [
        t["topic"]
        for t in sorted(topic_scores, key=lambda x: x["score"], reverse=True)
        if t["coverage_pct"] >= 65
    ]

    weak_topics = [
        t["topic"]
        for t in sorted(topic_scores, key=lambda x: x["score"])
        if t["coverage_pct"] < 55
    ]

    missing_topics = [t["topic"] for t in topic_scores if t["coverage_pct"] <= 5]

    return {
        "strong_topics": strong_topics,
        "weak_topics": weak_topics,
        "missing_topics": missing_topics,
        "topic_scores": topic_scores,
    }
