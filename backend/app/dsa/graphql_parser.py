from typing import Dict, Any, List


# ==========================================================
# Profile Parser
# ==========================================================

def parse_profile(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse the basic user profile.
    """

    profile = raw_data.get("profile", {})

    return {
        "username": raw_data.get("username"),

        "profile": {
            "realName": profile.get("realName"),
            "avatar": profile.get("userAvatar"),
            "ranking": profile.get("ranking", 0)
        }
    }


# ==========================================================
# Solved Statistics Parser
# ==========================================================

def parse_stats(raw_data: Dict[str, Any]) -> Dict[str, int]:
    """
    Parse solved problem statistics.
    """

    submit_stats = raw_data.get("submitStats", {})

    stats = {
        "all": 0,
        "easy": 0,
        "medium": 0,
        "hard": 0
    }

    difficulty_map = {
        "All": "all",
        "Easy": "easy",
        "Medium": "medium",
        "Hard": "hard"
    }

    for item in submit_stats.get("acSubmissionNum", []):

        difficulty = difficulty_map.get(item.get("difficulty"))

        if difficulty:
            stats[difficulty] = item.get("count", 0)

    return stats


# ==========================================================
# Topic Parser
# ==========================================================

def parse_topics(raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Parse topic-wise solved counts.
    """

    tag_counts = raw_data.get("tagProblemCounts", {})

    topics = []

    for level in ("fundamental", "intermediate", "advanced"):

        for topic in tag_counts.get(level, []):

            topics.append({

                "level": level,

                "tagSlug": topic.get("tagSlug"),

                "tagName": topic.get("tagName"),

                "problemsSolved": topic.get(
                    "problemsSolved",
                    0
                )

            })

    return topics


# ==========================================================
# Contest Parser (Phase 5)
# ==========================================================

def parse_contest(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse contest ranking and rating details.
    """

    contest = raw_data.get("userContestRanking") or {}

    return {
        "rating": contest.get("rating", 0) or 0,
        "globalRanking": contest.get("globalRanking", 0) or 0,
        "topPercentage": contest.get("topPercentage", 0) or 0,
        "contestsAttended": contest.get("attendedContestsCount", 0) or 0
    }


# ==========================================================
# Recent Submission Parser (Phase 5)
# ==========================================================

def parse_recent_submissions(raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Parse recent submission activity into a stable list.
    """

    submissions = raw_data.get("recentSubmissions") or []

    return [
        {
            "title": item.get("title"),
            "titleSlug": item.get("titleSlug"),
            "timestamp": item.get("timestamp"),
            "status": item.get("statusDisplay")
        }
        for item in submissions
        if isinstance(item, dict)
    ]


# ==========================================================
# Submission Calendar Parser (Phase 5)
# ==========================================================

def parse_submission_calendar(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Parse submission calendar data into a dictionary when available.
    """

    calendar = raw_data.get("submissionCalendar")

    if isinstance(calendar, dict):
        return calendar

    if isinstance(calendar, str):
        return {"raw": calendar}

    return {}


# ==========================================================
# Merge Everything
# ==========================================================

def merge_profile(raw_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Build the standard StudentOS profile.
    """

    profile = parse_profile(raw_data)

    profile["stats"] = parse_stats(raw_data)

    profile["topics"] = parse_topics(raw_data)

    profile["contest"] = parse_contest(raw_data)

    profile["recentSubmissions"] = parse_recent_submissions(raw_data)

    profile["submissionCalendar"] = parse_submission_calendar(raw_data)

    return profile