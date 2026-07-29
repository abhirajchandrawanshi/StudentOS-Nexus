import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.dsa.graphql_parser import merge_profile
from app.dsa.graphql_queries import PROFILE_QUERY


def test_profile_query_uses_supported_leetcode_fields_only():
    assert "userContestRanking" not in PROFILE_QUERY
    assert "recentSubmissions" not in PROFILE_QUERY


def test_merge_profile_includes_optional_leetcode_sections():
    raw_data = {
        "username": "alice",
        "profile": {
            "realName": "Alice Example",
            "userAvatar": "https://example.com/avatar.png",
            "ranking": 1200,
        },
        "submitStats": {
            "acSubmissionNum": [
                {"difficulty": "All", "count": 120},
                {"difficulty": "Easy", "count": 60},
                {"difficulty": "Medium", "count": 50},
                {"difficulty": "Hard", "count": 10},
            ]
        },
        "tagProblemCounts": {
            "fundamental": [{"tagSlug": "array", "tagName": "Array", "problemsSolved": 20}] 
        },
        "userContestRanking": {
            "rating": 2100,
            "globalRanking": 350,
            "topPercentage": 5,
            "attendedContestsCount": 12,
        },
        "submissionCalendar": {"1687824000": 3, "1687910400": 1},
        "recentSubmissions": [
            {"title": "Two Sum", "statusDisplay": "Accepted", "timestamp": 1687824000}
        ],
    }

    profile = merge_profile(raw_data)

    assert profile["stats"]["all"] == 120
    assert profile["contest"]["rating"] == 2100
    assert profile["contest"]["globalRanking"] == 350
    assert profile["submissionCalendar"]["1687824000"] == 3
    assert len(profile["recentSubmissions"]) == 1
