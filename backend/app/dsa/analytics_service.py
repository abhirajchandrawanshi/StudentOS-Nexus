"""
DSA Analytics Service
Orchestrates analytics calculation using specialized calculators.
"""

import logging
from typing import Dict, List, Any

from app.dsa.difficulty_stats import DifficultyBreakdownCalculator
from app.dsa.topic_mastery import TopicMasteryCalculator
from app.dsa.activity_metrics import ActivityMetricsCalculator

logger = logging.getLogger("dsa_analytics_service")


class AnalyticsProcessor:
    """Main processor for DSA analytics data using specialized calculators."""
    
    @staticmethod
    def process_analytics(
        username: str,
        stats: Dict[str, int],
        topics: List[Dict[str, Any]],
        placement_readiness: float,
        recommendations: List[Dict[str, Any]] = None,
        readiness: Dict[str, Any] = None,
        distribution: Dict[str, float] = None,
        topic_analytics: Dict[str, Any] = None,
        learning_roadmap: List[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Process all analytics data for dashboard response.
        
        Orchestrates calculations from specialized calculators:
        - DifficultyBreakdownCalculator: Difficulty distribution
        - TopicMasteryCalculator: Topic-wise progress
        - ActivityMetricsCalculator: Activity trends and heatmaps
        
        Args:
            username: LeetCode username
            stats: Dictionary with easy, medium, hard counts
            topics: List of topic statistics
            placement_readiness: Placement readiness score (0-100)
            
        Returns:
            Complete analytics data dictionary with:
            - totalSolved: Total problems solved
            - difficultyBreakdown: Breakdown by difficulty with percentages
            - topicMastery: Topic-wise progress sorted by mastery
            - placementReadiness: Placement readiness score
            - weeklyActivity: Daily activity distribution
            - monthlyTrend: Monthly trend with difficulty breakdown
            - heatmapData: Activity heatmap data
            
        Raises:
            ValueError: If stats or topics are invalid
        """
        if not isinstance(stats, dict) or not isinstance(topics, list):
            raise ValueError("Invalid stats or topics format")
        recommendations = recommendations or []
        readiness = readiness or {
            "score": placement_readiness,
            "percentage": placement_readiness,
            "level": "Unknown",
            "difficultyProgress": {},
        }
        distribution = distribution or {"easy": 0.0, "medium": 0.0, "hard": 0.0}
        topic_analytics = topic_analytics or {}
        learning_roadmap = learning_roadmap or []
        
        total_solved = stats.get("all", 0)
        easy = stats.get("easy", 0)
        medium = stats.get("medium", 0)
        hard = stats.get("hard", 0)
        
        # Calculate all metrics using specialized calculators
        difficulty_breakdown = DifficultyBreakdownCalculator.calculate(easy, medium, hard)
        topic_mastery = TopicMasteryCalculator.calculate_mastery(topics)
        weekly_activity = ActivityMetricsCalculator.calculate_weekly_activity(total_solved)
        monthly_trend = ActivityMetricsCalculator.calculate_monthly_trend(easy, medium, hard)
        heatmap_data = ActivityMetricsCalculator.calculate_heatmap_data(total_solved)
        
        analytics = {
            "username": username,
            "totalSolved": total_solved,
            "difficultyBreakdown": difficulty_breakdown,
            "problemSolvingDistribution": distribution,
            "topicMastery": topic_mastery,
            "placementReadiness": placement_readiness,
            "readiness": readiness,
            "topicAnalytics": topic_analytics,
            "recommendations": recommendations,
            "learningRoadmap": learning_roadmap,
            "weeklyActivity": weekly_activity,
            "monthlyTrend": monthly_trend,
            "heatmapData": heatmap_data
        }
        
        logger.info(
            f"Analytics processed for {username}: "
            f"total_solved={total_solved}, "
            f"placement_readiness={placement_readiness}%"
        )
        
        return analytics
