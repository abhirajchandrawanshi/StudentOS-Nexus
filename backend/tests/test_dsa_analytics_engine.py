import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.dsa.analytics_engine import analyze_profile_stats
from app.dsa.analytics_service import AnalyticsProcessor
from app.dsa.recommendation_engine import generate_dsa_recommendations


def test_analyze_profile_stats_builds_readiness_distribution_and_topic_rankings():
    profile = {
        "stats": {"easy": "75", "medium": 100, "hard": 10},
        "topics": [
            {"tagSlug": "array", "problemsSolved": 30},
            {"tagSlug": "dynamic-programming", "problemsSolved": 8},
            {"tagSlug": "graph", "problemsSolved": 4},
            {"tagSlug": "binary-tree", "problemsSolved": 24},
            {"tagSlug": "string", "problemsSolved": 36},
        ],
    }

    analyzed = analyze_profile_stats(profile)

    assert analyzed["stats"]["all"] == 185
    assert analyzed["distribution"] == {"easy": 40.5, "medium": 54.1, "hard": 5.4}
    assert analyzed["placementReadiness"] == 42.5
    assert analyzed["readiness"]["level"] == "Building Foundation"

    ranked = analyzed["topicAnalytics"]["rankedTopics"]
    assert ranked[0]["topic"] == "Strings"
    assert ranked[0]["rank"] == 1
    assert analyzed["topicAnalytics"]["weakestTopics"][0]["topic"] == "Backtracking"
    assert analyzed["learningRoadmap"][0]["topic"] == "Backtracking"


def test_analyze_profile_stats_handles_missing_and_invalid_payloads():
    analyzed = analyze_profile_stats({"stats": {"all": "bad"}, "topics": [None, "bad"]})

    assert analyzed["stats"] == {"all": 0, "easy": 0, "medium": 0, "hard": 0}
    assert analyzed["distribution"] == {"easy": 0.0, "medium": 0.0, "hard": 0.0}
    assert analyzed["placementReadiness"] == 0.0
    assert len(analyzed["topics"]) == 9
    assert len(analyzed["learningRoadmap"]) == 3


def test_analytics_processor_returns_enriched_dashboard_payload():
    analyzed = analyze_profile_stats({
        "stats": {"all": 60, "easy": 30, "medium": 25, "hard": 5},
        "topics": [{"tagSlug": "array", "problemsSolved": 20}],
    })
    recommendations = generate_dsa_recommendations(analyzed)

    dashboard = AnalyticsProcessor.process_analytics(
        username="alice",
        stats=analyzed["stats"],
        topics=analyzed["topics"],
        placement_readiness=analyzed["placementReadiness"],
        recommendations=recommendations,
        readiness=analyzed["readiness"],
        distribution=analyzed["distribution"],
        topic_analytics=analyzed["topicAnalytics"],
        learning_roadmap=analyzed["learningRoadmap"],
    )

    assert dashboard["username"] == "alice"
    assert dashboard["totalSolved"] == 60
    assert dashboard["problemSolvingDistribution"] == analyzed["distribution"]
    assert dashboard["readiness"]["percentage"] == analyzed["placementReadiness"]
    assert dashboard["topicAnalytics"]["weakestTopics"]
    assert dashboard["recommendations"]
    assert dashboard["learningRoadmap"]
