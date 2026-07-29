import logging
from typing import Any, Dict


logger = logging.getLogger("dsa_analytics_engine")


TOPIC_DEFINITIONS = {
    "Arrays": {
        "tags": ["array", "hash-table", "two-pointers", "sliding-window", "sorting", "matrix"],
        "total": 50,
        "color": "#6366f1",
    },
    "Trees": {
        "tags": ["tree", "binary-tree", "binary-search-tree", "heap-priority-queue", "heap", "trie"],
        "total": 45,
        "color": "#8b5cf6",
    },
    "Graphs": {
        "tags": ["graph", "breadth-first-search", "depth-first-search", "topological-sort", "union-find", "shortest-path"],
        "total": 40,
        "color": "#ec4899",
    },
    "DP": {
        "tags": ["dynamic-programming", "greedy", "memoization"],
        "total": 50,
        "color": "#f59e0b",
    },
    "Strings": {
        "tags": ["string", "string-matching"],
        "total": 40,
        "color": "#10b981",
    },
}


DEFAULT_STATS = {
    "all": 0,
    "easy": 0,
    "medium": 0,
    "hard": 0,
}


def _normalize_stats(stats: Dict[str, Any]) -> Dict[str, int]:
    """
    Keep analytics independent from external payload quirks.
    The parser owns GraphQL field mapping; analytics only accepts StudentOS stats.
    """

    normalized = DEFAULT_STATS.copy()

    for key in normalized:
        try:
            normalized[key] = int(stats.get(key, 0) or 0)
        except (TypeError, ValueError):
            logger.warning("Invalid stats.%s value received: %r", key, stats.get(key))

    return normalized


def analyze_profile_stats(profile_data: dict) -> dict:
    """
    Analyze the standardized StudentOS profile.

    Responsibilities:
    1. Read parsed difficulty statistics.
    2. Calculate Placement Readiness.
    3. Aggregate topic-wise progress.
    """

    logger.info("Analyzing StudentOS profile.")

    # ---------------------------------------
    # Read Parsed Difficulty Statistics
    # ---------------------------------------

    stats = _normalize_stats(profile_data.get("stats", {}))

    logger.info("Analytics input stats: %s", stats)

    # ---------------------------------------
    # Placement Readiness Calculation
    # ---------------------------------------

    EASY_TARGET = 150
    MEDIUM_TARGET = 200
    HARD_TARGET = 50

    easy_ratio = min(1.0, stats["easy"] / EASY_TARGET)
    medium_ratio = min(1.0, stats["medium"] / MEDIUM_TARGET)
    hard_ratio = min(1.0, stats["hard"] / HARD_TARGET)

    placement_readiness = round(
        min(
            100,
            (easy_ratio * 20)
            + (medium_ratio * 55)
            + (hard_ratio * 25)
        ),
        1
    )

    logger.info(
        "Placement Readiness calculated: %.1f%%",
        placement_readiness
    )

    # ---------------------------------------
    # Topic Analytics
    # ---------------------------------------

    parsed_topics = profile_data.get("topics", [])

    tag_lookup = {}

    for topic in parsed_topics:

        slug = topic.get("tagSlug", "").lower()

        tag_lookup[slug] = topic.get(
            "problemsSolved",
            0
        )

    topics_list = []

    for topic_name, config in TOPIC_DEFINITIONS.items():

        solved = sum(

            tag_lookup.get(tag, 0)

            for tag in config["tags"]

        )

        solved = min(
            solved,
            config["total"]
        )

        topics_list.append({

            "topic": topic_name,

            "solved": solved,

            "total": config["total"],

            "color": config["color"]

        })

    logger.info(
        "Generated analytics for %d curriculum topics.",
        len(topics_list)
    )

    return {

        "stats": stats,

        "placementReadiness": placement_readiness,

        "topics": topics_list

    }
