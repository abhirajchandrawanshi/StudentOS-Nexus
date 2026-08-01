from __future__ import annotations

from typing import Any, Dict, List


COMPANY_INTERVIEW_DATA: Dict[str, Dict[str, Any]] = {
    "Amazon": {
        "important_topics": [
            "Arrays",
            "Graphs",
            "Trees",
            "DP",
            "HashMap",
            "Strings",
        ],
        "frequency_weight": 0.95,
        "difficulty_distribution": {
            "Arrays": "25%",
            "Graphs": "18%",
            "Trees": "15%",
            "DP": "12%",
            "HashMap": "10%",
        },
    },
    "Google": {
        "important_topics": [
            "Graphs",
            "DP",
            "Arrays",
            "Trees",
            "Strings",
            "Heap",
        ],
        "frequency_weight": 0.93,
        "difficulty_distribution": {
            "Graphs": "22%",
            "DP": "20%",
            "Arrays": "16%",
            "Trees": "14%",
            "Strings": "10%",
        },
    },
    "Microsoft": {
        "important_topics": [
            "Strings",
            "Arrays",
            "Trees",
            "DP",
            "Graphs",
            "Sorting",
        ],
        "frequency_weight": 0.88,
        "difficulty_distribution": {
            "Strings": "20%",
            "Arrays": "18%",
            "Trees": "16%",
            "DP": "15%",
            "Graphs": "12%",
        },
    },
    "Meta": {
        "important_topics": [
            "Graphs",
            "DP",
            "Trees",
            "Arrays",
            "HashMap",
            "Strings",
        ],
        "frequency_weight": 0.9,
        "difficulty_distribution": {
            "Graphs": "24%",
            "DP": "19%",
            "Trees": "15%",
            "Arrays": "14%",
            "HashMap": "10%",
        },
    },
    "Adobe": {
        "important_topics": [
            "Strings",
            "Arrays",
            "DP",
            "Trees",
            "Graphs",
            "HashMap",
        ],
        "frequency_weight": 0.84,
        "difficulty_distribution": {
            "Strings": "22%",
            "Arrays": "18%",
            "DP": "16%",
            "Trees": "14%",
            "Graphs": "12%",
        },
    },
    "Atlassian": {
        "important_topics": [
            "Arrays",
            "Strings",
            "Trees",
            "Graphs",
            "DP",
            "HashMap",
        ],
        "frequency_weight": 0.86,
        "difficulty_distribution": {
            "Arrays": "20%",
            "Strings": "18%",
            "Trees": "15%",
            "Graphs": "13%",
            "DP": "12%",
        },
    },
    "Uber": {
        "important_topics": [
            "Graphs",
            "Arrays",
            "DP",
            "Trees",
            "HashMap",
            "Strings",
        ],
        "frequency_weight": 0.89,
        "difficulty_distribution": {
            "Graphs": "21%",
            "Arrays": "18%",
            "DP": "17%",
            "Trees": "14%",
            "HashMap": "10%",
        },
    },
    "Goldman Sachs": {
        "important_topics": [
            "Arrays",
            "Strings",
            "DP",
            "Graphs",
            "Trees",
            "Heap",
        ],
        "frequency_weight": 0.87,
        "difficulty_distribution": {
            "Arrays": "19%",
            "Strings": "18%",
            "DP": "16%",
            "Graphs": "14%",
            "Trees": "12%",
        },
    },
}


def _normalize_company_name(company_name: str) -> str:
    """Normalize company names for loose matching against the dataset."""
    if not company_name:
        return ""

    normalized = company_name.strip().lower()
    aliases = {
        "atlassian": "Atlassian",
        "amazon": "Amazon",
        "google": "Google",
        "microsoft": "Microsoft",
        "meta": "Meta",
        "adobe": "Adobe",
        "uber": "Uber",
        "goldman sachs": "Goldman Sachs",
        "goldman": "Goldman Sachs",
    }
    return aliases.get(normalized, company_name.strip().title())


def recommend_topics(company_name: str) -> List[Dict[str, Any]]:
    """Return a ranked list of interview topics for the provided company."""
    normalized_name = _normalize_company_name(company_name)
    profile = COMPANY_INTERVIEW_DATA.get(normalized_name)

    if not profile:
        return []

    ranked_topics: List[Dict[str, Any]] = []
    for topic in profile["important_topics"]:
        difficulty = profile["difficulty_distribution"].get(topic, "0%")
        ranked_topics.append(
            {
                "topic": topic,
                "weight": round(profile["frequency_weight"] * 100, 2),
                "difficulty_distribution": difficulty,
            }
        )

    ranked_topics.sort(key=lambda item: item["topic"], reverse=False)
    return ranked_topics
