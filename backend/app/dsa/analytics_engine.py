import logging
from typing import Any, Dict


logger = logging.getLogger("dsa_analytics_engine")


TOPIC_DEFINITIONS = {
    "Arrays": {
        "tags": ["array", "hash-table", "two-pointers", "sliding-window", "sorting", "matrix"],
        "total": 50,
        "color": "#6366f1",
    },
    "Linked List": {
        "tags": ["linked-list"],
        "total": 30,
        "color": "#06b6d4",
    },
    "Trees": {
        "tags": ["tree", "binary-tree", "binary-search-tree", "trie"],
        "total": 45,
        "color": "#8b5cf6",
    },
    "Graphs": {
        "tags": ["graph", "breadth-first-search", "depth-first-search", "topological-sort", "union-find", "shortest-path"],
        "total": 40,
        "color": "#ec4899",
    },
    "Dynamic Programming": {
        "tags": ["dynamic-programming", "memoization"],
        "total": 50,
        "color": "#f59e0b",
    },
    "Greedy": {
        "tags": ["greedy"],
        "total": 30,
        "color": "#22c55e",
    },
    "Binary Search": {
        "tags": ["binary-search"],
        "total": 30,
        "color": "#38bdf8",
    },
    "Backtracking": {
        "tags": ["backtracking", "recursion"],
        "total": 25,
        "color": "#f97316",
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


READINESS_TARGETS = {
    "easy": {"target": 150, "weight": 20},
    "medium": {"target": 200, "weight": 55},
    "hard": {"target": 50, "weight": 25},
}


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return max(0, int(value or default))
    except (TypeError, ValueError):
        return default


def _normalize_stats(stats: Dict[str, Any]) -> Dict[str, int]:
    """
    Keep analytics independent from external payload quirks.
    The parser owns GraphQL field mapping; analytics only accepts StudentOS stats.
    """

    normalized = DEFAULT_STATS.copy()
    stats = stats if isinstance(stats, dict) else {}

    for key in normalized:
        value = _safe_int(stats.get(key))
        if stats.get(key) not in (None, "") and value == 0 and str(stats.get(key)) not in ("0", "0.0"):
            logger.warning("Invalid stats.%s value received: %r", key, stats.get(key))
        normalized[key] = value

    difficulty_sum = normalized["easy"] + normalized["medium"] + normalized["hard"]
    if difficulty_sum > 0 and normalized["all"] < difficulty_sum:
        logger.info(
            "Reconciling total solved from %s to difficulty sum %s",
            normalized["all"],
            difficulty_sum,
        )
        normalized["all"] = difficulty_sum

    return normalized


def _calculate_distribution(stats: Dict[str, int]) -> Dict[str, float]:
    total = stats["all"] or stats["easy"] + stats["medium"] + stats["hard"]
    if total <= 0:
        return {"easy": 0.0, "medium": 0.0, "hard": 0.0}

    return {
        "easy": round((stats["easy"] / total) * 100, 1),
        "medium": round((stats["medium"] / total) * 100, 1),
        "hard": round((stats["hard"] / total) * 100, 1),
    }


def _calculate_readiness(stats: Dict[str, int]) -> Dict[str, Any]:
    difficulty_progress = {}
    placement_readiness = 0.0

    for difficulty, config in READINESS_TARGETS.items():
        solved = stats[difficulty]
        target = config["target"]
        weight = config["weight"]
        progress = min(100.0, (solved / target) * 100) if target else 0.0
        contribution = (progress / 100) * weight
        placement_readiness += contribution
        difficulty_progress[difficulty] = {
            "solved": solved,
            "target": target,
            "progress": round(progress, 1),
            "weight": weight,
            "contribution": round(contribution, 1),
        }

    score = round(min(100.0, placement_readiness), 1)

    if score >= 80:
        level = "Interview Ready"
    elif score >= 55:
        level = "Nearly Ready"
    elif score >= 30:
        level = "Building Foundation"
    else:
        level = "Getting Started"

    return {
        "score": score,
        "percentage": score,
        "level": level,
        "difficultyProgress": difficulty_progress,
    }


def _rank_topics(topics_list: list) -> list:
    ranked = []
    for topic in topics_list:
        total = _safe_int(topic.get("total"))
        solved = _safe_int(topic.get("solved"))
        percentage = round((solved / total) * 100, 1) if total else 0.0
        ranked.append({
            **topic,
            "percentage": percentage,
            "rank": 0,
            "status": (
                "strong" if percentage >= 75
                else "improving" if percentage >= 45
                else "weak"
            ),
        })

    ranked.sort(key=lambda item: (item["percentage"], item["solved"]), reverse=True)
    for index, topic in enumerate(ranked, start=1):
        topic["rank"] = index

    return ranked


def _build_learning_roadmap(ranked_topics: list, readiness: Dict[str, Any]) -> list:
    weak_topics = [topic for topic in reversed(ranked_topics) if topic["status"] == "weak"]
    focus_topics = weak_topics[:3] or list(reversed(ranked_topics))[:3]

    if readiness["score"] < 40:
        difficulty = "Start with Easy, then add Medium after every 3 solved problems"
    elif readiness["score"] < 75:
        difficulty = "Prioritize Medium, with one Hard problem per focused topic"
    else:
        difficulty = "Use Medium for speed and Hard for interview-depth practice"

    return [
        {
            "step": index,
            "topic": topic["topic"],
            "focus": f"Raise {topic['topic']} from {topic['percentage']}% mastery",
            "difficultyProgression": difficulty,
            "targetProblems": max(5, min(15, topic["total"] - topic["solved"])),
        }
        for index, topic in enumerate(focus_topics, start=1)
    ]


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

    profile_data = profile_data if isinstance(profile_data, dict) else {}
    stats = _normalize_stats(profile_data.get("stats", {}))
    distribution = _calculate_distribution(stats)

    logger.info("Analytics input stats: %s", stats)

    # ---------------------------------------
    # Placement Readiness Calculation
    # ---------------------------------------

    readiness = _calculate_readiness(stats)
    placement_readiness = readiness["score"]

    logger.info(
        "Placement Readiness calculated: %.1f%%",
        placement_readiness
    )

    # ---------------------------------------
    # Topic Analytics
    # ---------------------------------------

    parsed_topics = profile_data.get("topics", [])
    parsed_topics = parsed_topics if isinstance(parsed_topics, list) else []

    tag_lookup = {}

    for topic in parsed_topics:

        if not isinstance(topic, dict):
            logger.warning("Skipping invalid topic payload: %r", topic)
            continue

        slug = str(topic.get("tagSlug") or "").lower()

        tag_lookup[slug] = _safe_int(topic.get("problemsSolved"))

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

    ranked_topics = _rank_topics(topics_list)
    strongest_topics = ranked_topics[:3]
    weakest_topics = list(reversed(ranked_topics))[:3]
    learning_roadmap = _build_learning_roadmap(ranked_topics, readiness)

    logger.info(
        "Generated analytics for %d curriculum topics.",
        len(topics_list)
    )

    return {

        "stats": stats,

        "distribution": distribution,

        "placementReadiness": placement_readiness,

        "readiness": readiness,

        "topics": topics_list,

        "topicAnalytics": {
            "rankedTopics": ranked_topics,
            "strongestTopics": strongest_topics,
            "weakestTopics": weakest_topics,
        },

        "learningRoadmap": learning_roadmap

    }
