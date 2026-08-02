from __future__ import annotations

from typing import Any, Dict, List

CORE_TOPICS: List[str] = ["Arrays", "Trees", "Graphs", "DP", "Strings"]


_COMPANY_DATASET: Dict[str, Dict[str, Any]] = {
    "google": {
        "company": "Google",
        "topic_weights": {"Graphs": 40, "DP": 30, "Trees": 15, "Arrays": 10, "Strings": 5},
        "frequently_asked_topics": ["Graphs", "DP", "Trees", "System Design", "Recursion"],
        "interview_trends": [
            "Preference for optimization-heavy solutions",
            "Follow-up complexity analysis is common",
            "Multi-approach discussion is often expected",
        ],
    },
    "amazon": {
        "company": "Amazon",
        "topic_weights": {"Trees": 30, "Arrays": 25, "Graphs": 20, "DP": 15, "Strings": 10},
        "frequently_asked_topics": ["Trees", "Arrays", "Graphs", "HashMap", "Sliding Window"],
        "interview_trends": [
            "Emphasis on clean implementation and edge cases",
            "Behavioral and coding rounds are both weighted",
            "Medium-difficulty depth is highly important",
        ],
    },
    "atlassian": {
        "company": "Atlassian",
        "topic_weights": {"DP": 30, "Arrays": 25, "Strings": 20, "Trees": 15, "Graphs": 10},
        "frequently_asked_topics": ["DP", "Arrays", "Strings", "Low Level Design", "Concurrency"],
        "interview_trends": [
            "Strong focus on communication and tradeoffs",
            "Practical coding style with maintainable structure",
            "Problem decomposition is assessed explicitly",
        ],
    },
    "startups": {
        "company": "Startups",
        "topic_weights": {"Arrays": 30, "Strings": 25, "Trees": 15, "Graphs": 15, "DP": 15},
        "frequently_asked_topics": ["Arrays", "Strings", "HashMap", "Basic Graphs"],
        "interview_trends": [
            "Speed and practical problem solving are prioritized",
            "Foundational DSA with strong coding hygiene",
            "Breadth across common patterns is preferred",
        ],
    },
}


def load_company_dataset() -> Dict[str, Dict[str, Any]]:
    """Return the full company intelligence dataset."""
    return _COMPANY_DATASET


def get_company_intelligence(company: str | None) -> Dict[str, Any]:
    """Return normalized structured company intelligence for a single company."""
    key = (company or "startups").strip().lower()
    data = _COMPANY_DATASET.get(key, _COMPANY_DATASET["startups"])

    normalized_weights = {topic: int(data["topic_weights"].get(topic, 0)) for topic in CORE_TOPICS}

    return {
        "company": data["company"],
        "topic_weights": normalized_weights,
        "frequently_asked_topics": list(data["frequently_asked_topics"]),
        "interview_trends": list(data["interview_trends"]),
    }
