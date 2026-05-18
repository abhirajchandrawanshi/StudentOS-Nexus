from typing import Dict, Any, List

# Decoupled knowledge repository mapping core interview behaviors and topic distributions.
COMPANY_PROFILES: Dict[str, Dict[str, Any]] = {
    "google": {
        "companyName": "Google",
        "description": "Focuses heavily on mathematically complex dynamic programming, complex graphs, and highly-optimized recursive algorithms.",
        "difficultyRatios": {"Easy": 0.10, "Medium": 0.50, "Hard": 0.40},
        "topicPriorities": {
            "Graphs": 40,
            "DP": 35,
            "Trees": 12,
            "Arrays": 8,
            "Strings": 5
        },
        "advice": "Prioritize cycle detection, topological sorting, segment trees, and dynamic programming state transitions. Focus on optimal big-O complexity."
    },
    "amazon": {
        "companyName": "Amazon",
        "description": "Heavily tests logical traversals in trees/BSTs, array manipulation, sliding window, and graph traversals for system flows.",
        "difficultyRatios": {"Easy": 0.20, "Medium": 0.60, "Hard": 0.20},
        "topicPriorities": {
            "Trees": 35,
            "Arrays": 25,
            "Graphs": 20,
            "DP": 10,
            "Strings": 10
        },
        "advice": "Revise BFS/DFS tree levels, hash tables, prefix sums, and sliding window boundaries. Prepare for clean, production-ready coding style."
    },
    "atlassian": {
        "companyName": "Atlassian",
        "description": "Emphasizes modular design patterns, clean separation of concerns, systems algorithms, concurrency, and practical DSA structures.",
        "difficultyRatios": {"Easy": 0.15, "Medium": 0.70, "Hard": 0.15},
        "topicPriorities": {
            "DP": 30,
            "Arrays": 25,
            "Strings": 20,
            "Trees": 15,
            "Graphs": 10
        },
        "advice": "Write clean helper functions and explain intermediate states clearly. Revise dynamic allocation, sliding window, memoization, and data structures design."
    },
    "razorpay": {
        "companyName": "Razorpay",
        "description": "Focuses on robust backend operations, handling arrays efficiently, string parser validations, and core data manipulations.",
        "difficultyRatios": {"Easy": 0.20, "Medium": 0.65, "Hard": 0.15},
        "topicPriorities": {
            "Arrays": 40,
            "Strings": 25,
            "Trees": 15,
            "DP": 10,
            "Graphs": 10
        },
        "advice": "Prioritize interval merging, string processing, fast lookups, map operations, and low-level data sanitizations."
    },
    "startups": {
        "companyName": "Startups",
        "description": "Prioritizes high problem-solving speed, clean algorithmic code, and immediate foundations of structural programming.",
        "difficultyRatios": {"Easy": 0.35, "Medium": 0.55, "Hard": 0.10},
        "topicPriorities": {
            "Arrays": 45,
            "Strings": 25,
            "DP": 15,
            "Trees": 10,
            "Graphs": 5
        },
        "advice": "Work on quick coding iterations. Build strong foundations in arrays, lists, maps, sliding window, and basic recursion."
    }
}

def get_company_profile(company_name: str) -> Dict[str, Any]:
    """
    Retrieves the interview template profile for a specific company (case-insensitive).
    Defaults to 'Startups' profile if company is unrecognized.
    """
    normalized = company_name.strip().lower()
    return COMPANY_PROFILES.get(normalized, COMPANY_PROFILES["startups"])

def aggregate_company_topic_priorities(companies: List[str]) -> Dict[str, float]:
    """
    Combines priority vectors for multiple user-selected companies by computing
    a normalized average topic priority weight.
    """
    if not companies:
        return COMPANY_PROFILES["startups"]["topicPriorities"]

    aggregated: Dict[str, float] = {"Arrays": 0.0, "Trees": 0.0, "Graphs": 0.0, "DP": 0.0, "Strings": 0.0}
    count = 0

    for name in companies:
        prof = get_company_profile(name)
        priorities = prof["topicPriorities"]
        for topic, val in priorities.items():
            aggregated[topic] = aggregated.get(topic, 0.0) + val
        count += 1

    # Compute average and round to nearest decimal
    for topic in aggregated:
        aggregated[topic] = round(aggregated[topic] / count, 1)

    return aggregated
