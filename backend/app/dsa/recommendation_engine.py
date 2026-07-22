from typing import List, Dict, Any
import logging
import random

from app.dsa.question_bank import get_questions_by_topic
from app.dsa.resource_mapper import get_curated_pedagogical_resources

logger = logging.getLogger("dsa_recommendation_engine")
logger.setLevel(logging.INFO)


def generate_dsa_recommendations(analyzed_data: dict) -> List[dict]:
    """
    Generates personalized quick prep cards based on the user's analyzed DSA tracks.
    Used for the dashboard dashboard highlights.
    """
    topics = analyzed_data.get("topics", [])
    stats = analyzed_data.get("stats", {})
    
    # 1. Determine the weakest topic track
    weakest_topic = None
    lowest_pct = 101.0  # start higher than 100%

    for t in topics:
        solved = t.get("solved", 0)
        total = t.get("total", 1)
        pct = (solved / total) * 100.0
        
        # Find the topic with the lowest progress
        if pct < lowest_pct:
            lowest_pct = pct
            weakest_topic = t.get("topic")

    # Fallback if no topics found
    if not weakest_topic:
        weakest_topic = "Graphs"
        lowest_pct = 30.0

    # Define track-specific advice
    lowest_pct_rounded = int(round(lowest_pct))
    
    track_recommendations = {
        "Arrays": {
            "title": "Practice Hash Maps & Hashing",
            "desc": f"Your weakest topic — only {lowest_pct_rounded}% solved. Arrays form 80% of screening rounds.",
            "action": "Start practicing"
        },
        "Trees": {
            "title": "Master DFS & Recursion",
            "desc": f"Your weakest topic — only {lowest_pct_rounded}% solved. Revise post-order/pre-order traversals.",
            "action": "Revise Trees"
        },
        "Graphs": {
            "title": "Practice Graph BFS/DFS",
            "desc": f"Your weakest topic — only {lowest_pct_rounded}% solved. BFS/DFS are highly popular in big tech.",
            "action": "Start practicing"
        },
        "DP": {
            "title": "Master DP & Memoization",
            "desc": f"Your weakest topic — only {lowest_pct_rounded}% solved. Work on overlapping subproblems step-by-step.",
            "action": "Practice DP"
        },
        "Strings": {
            "title": "Learn Sliding Window & Strings",
            "desc": f"Your weakest topic — only {lowest_pct_rounded}% solved. Master substring and character manipulation.",
            "action": "Solve Strings"
        }
    }

    weakest_advice = track_recommendations.get(weakest_topic, track_recommendations["Graphs"])

    # 2. Generate consistency card based on solved total
    total_solved = stats.get("all", 0)
    
    if total_solved < 100:
        consistency_advice = {
            "title": "Build Daily DSA Streak",
            "desc": "Practice at least 1 easy problem daily to build strong analytical muscle memory.",
            "action": "Solve Daily LeetCode"
        }
    elif total_solved < 250:
        consistency_advice = {
            "title": "Attempt Medium Problems",
            "desc": "Great job! Shift focus to Medium-difficulty problems to level up placement readiness.",
            "action": "Practice Mediums"
        }
    else:
        consistency_advice = {
            "title": "Solve Hard Challenges",
            "desc": "Excellent problem count! Tackle hard-level graph and DP problems to ace super-dream interviews.",
            "action": "Tackle Hard Tag"
        }

    # Extract pedagogical resource
    pedagogy = get_curated_pedagogical_resources(weakest_topic, analyzed_data.get("placementReadiness", 50.0))

    # 3. Compile all recommendations with consistent styles
    recommendations = [
        {
            "id": 1,
            "type": "dsa",
            "icon": "Code2",
            "color": "text-indigo-400",
            "bg": "bg-indigo-500/10",
            "border": "border-indigo-500/20",
            "title": weakest_advice["title"],
            "desc": weakest_advice["desc"],
            "action": weakest_advice["action"],
            "path": "/app/dsa"
        },
        {
            "id": 2,
            "type": "notes",
            "icon": "BookOpen",
            "color": "text-emerald-400",
            "bg": "bg-emerald-500/10",
            "border": "border-emerald-500/20",
            "title": f"Study Notes: {pedagogy['title']}",
            "desc": f"Revise: {', '.join(pedagogy['checklist'][:2])}. {pedagogy['desc']}",
            "action": "Review Notes",
            "path": pedagogy["path"]
        },
        {
            "id": 3,
            "type": "interview",
            "icon": "Mic",
            "color": "text-pink-400",
            "bg": "bg-pink-500/10",
            "border": "border-pink-500/20",
            "title": "Mock Technical Interview",
            "desc": "Assess your code delivery, time management, and communication skills.",
            "action": "Start session",
            "path": "/app/interviewer"
        }
    ]

    return recommendations


def generate_dynamic_leetcode_sheet(
    username: str,
    priorities: Dict[str, int],       # {"Graphs": 40, "DP": 30, "Trees": 15, "Arrays": 10, "Strings": 5}
    total_q: int,                    # e.g. 30
    readiness: float,                # User's calculated placement readiness
    target_companies: List[str],     # ["Google", "Amazon"]
    solved_questions_slugs: List[str] = None  # user's already solved question slugs
) -> List[Dict[str, Any]]:
    """
    Core algorithm to dynamically compile a preparation sheet:
    1. Computes topic allotments using integer ratios from priorities.
    2. Maps difficulty ratios based on user placement readiness score.
    3. Filters out solved questions.
    4. Ranks pool prioritizing target company alignments.
    """
    if solved_questions_slugs is None:
        solved_questions_slugs = []

    # 1. Allocate exact quotas across topics
    topic_allocations = {}
    remainder = total_q
    
    # Sort topics by weight descending to avoid rounding errors
    sorted_topics = sorted(priorities.items(), key=lambda x: x[1], reverse=True)
    
    for idx, (topic, weight) in enumerate(sorted_topics):
        if idx == len(sorted_topics) - 1:
            topic_allocations[topic] = max(0, remainder)
        else:
            allocated = int(round((weight / 100.0) * total_q))
            topic_allocations[topic] = allocated
            remainder -= allocated

    # 2. Map Difficulty Ratios based on Placement Readiness
    # Higher readiness index leads to harder questions; lower readiness focuses on foundations.
    if readiness < 40.0:
        difficulty_ratios = {"Easy": 0.60, "Medium": 0.40, "Hard": 0.00}
    elif readiness < 75.0:
        difficulty_ratios = {"Easy": 0.20, "Medium": 0.60, "Hard": 0.20}
    else:
        difficulty_ratios = {"Easy": 0.10, "Medium": 0.50, "Hard": 0.40}

    selected_questions = []

    # 3. Pull questions for each topic
    for topic, count in topic_allocations.items():
        if count <= 0:
            continue
        
        # Fetch matching questions from curated bank
        question_pool = get_questions_by_topic(topic)
        if not question_pool:
            continue

        # Exclude questions the user has already solved on LeetCode
        unsolved_pool = [q for q in question_pool if q["titleSlug"].lower() not in [s.lower() for s in solved_questions_slugs]]
        if not unsolved_pool:
            # If all solved, fall back to entire pool to ensure we don't return an empty sheet
            unsolved_pool = question_pool

        # Rank pool dynamically: Questions matching chosen target companies are prioritized.
        # Secondary ordering by rating value.
        target_companies_lower = [c.lower() for c in target_companies]
        
        def ranking_key(q):
            # Check if any company tags overlap
            matches_company = any(c.lower() in target_companies_lower for c in q.get("companyTags", []))
            return (1 if matches_company else 0, q.get("rating", 1200))

        unsolved_pool.sort(key=ranking_key, reverse=True)

        # Allocate difficulty targets
        easy_target = max(0, int(round(count * difficulty_ratios["Easy"])))
        medium_target = max(0, int(round(count * difficulty_ratios["Medium"])))
        hard_target = max(0, count - (easy_target + medium_target))

        # Retrieve allocations
        easy_qs = [q for q in unsolved_pool if q["difficulty"] == "Easy"][:easy_target]
        med_qs = [q for q in unsolved_pool if q["difficulty"] == "Medium"][:medium_target]
        hard_qs = [q for q in unsolved_pool if q["difficulty"] == "Hard"][:hard_target]

        allocated_qs = easy_qs + med_qs + hard_qs
        
        # Backfill if specific difficulty limits were empty
        if len(allocated_qs) < count:
            remaining = count - len(allocated_qs)
            backfill_pool = [q for q in unsolved_pool if q not in allocated_qs]
            allocated_qs.extend(backfill_pool[:remaining])

        selected_questions.extend(allocated_qs)

    # Scramble question index slightly within their respective tracks for realism, but preserve groupings
    # or just sort them by topic and difficulty level for aesthetic presentation.
    diff_order = {"Easy": 0, "Medium": 1, "Hard": 2}
    selected_questions.sort(key=lambda x: (x["topic"], diff_order.get(x["difficulty"], 1)))

    return selected_questions
