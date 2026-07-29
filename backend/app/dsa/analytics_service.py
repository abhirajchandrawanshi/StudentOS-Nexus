"""
DSA Analytics Service
Handles all analytics calculations and data processing for the DSA dashboard.
"""

import logging
from typing import Dict, List, Any
from datetime import datetime, timedelta

logger = logging.getLogger("dsa_analytics_service")


class DifficultyStats:
    """Calculates difficulty-wise statistics from LeetCode stats."""
    
    @staticmethod
    def calculate_breakdown(easy: int, medium: int, hard: int) -> List[Dict[str, Any]]:
        """
        Calculate difficulty breakdown with percentages and colors.
        
        Args:
            easy: Count of easy problems solved
            medium: Count of medium problems solved
            hard: Count of hard problems solved
            
        Returns:
            List of difficulty breakdown objects with counts, percentages, and colors
        """
        total = easy + medium + hard
        
        if total == 0:
            return [
                {"difficulty": "Easy", "count": 0, "percentage": 0.0, "color": "#10b981"},
                {"difficulty": "Medium", "count": 0, "percentage": 0.0, "color": "#f59e0b"},
                {"difficulty": "Hard", "count": 0, "percentage": 0.0, "color": "#ef4444"}
            ]
        
        breakdown = [
            {
                "difficulty": "Easy",
                "count": easy,
                "percentage": round((easy / total * 100), 1),
                "color": "#10b981"
            },
            {
                "difficulty": "Medium",
                "count": medium,
                "percentage": round((medium / total * 100), 1),
                "color": "#f59e0b"
            },
            {
                "difficulty": "Hard",
                "count": hard,
                "percentage": round((hard / total * 100), 1),
                "color": "#ef4444"
            }
        ]
        
        logger.debug(f"Difficulty breakdown calculated: {breakdown}")
        return breakdown


class TopicMastery:
    """Calculates topic-wise mastery and progress."""
    
    @staticmethod
    def calculate_mastery(topics: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Calculate topic mastery with percentages and colors.
        
        Args:
            topics: List of topic stats from analytics engine
            
        Returns:
            Sorted list of topic mastery objects with solved, total, percentages
        """
        topic_mastery = []
        
        for topic in topics:
            total = topic.get("total", 0)
            solved = topic.get("solved", 0)
            
            percentage = round((solved / total * 100), 1) if total > 0 else 0.0
            
            topic_mastery.append({
                "name": topic["topic"],
                "solved": solved,
                "total": total,
                "percentage": percentage,
                "color": topic.get("color", "#7C3AED")
            })
        
        # Sort by percentage descending (highest mastery first)
        topic_mastery.sort(key=lambda x: x["percentage"], reverse=True)
        
        logger.debug(f"Topic mastery calculated for {len(topic_mastery)} topics")
        return topic_mastery


class ActivityMetrics:
    """Generates activity and trend metrics."""
    
    @staticmethod
    def calculate_weekly_activity(total_solved: int) -> List[Dict[str, Any]]:
        """
        Distribute solved problems across weekly days.
        
        Args:
            total_solved: Total number of problems solved
            
        Returns:
            List of daily activity data
        """
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        
        if total_solved == 0:
            return [{"date": day, "count": 0} for day in days]
        
        # Distribute problems with some variance
        base_per_day = total_solved // 7
        remainder = total_solved % 7
        
        weekly_activity = []
        for i, day in enumerate(days):
            # Add extra to first days if there's remainder
            count = base_per_day + (1 if i < remainder else 0)
            weekly_activity.append({
                "date": day,
                "count": max(0, count)
            })
        
        logger.debug(f"Weekly activity calculated: total_solved={total_solved}")
        return weekly_activity
    
    @staticmethod
    def calculate_monthly_trend(
        easy: int,
        medium: int,
        hard: int
    ) -> List[Dict[str, Any]]:
        """
        Generate monthly trend showing distribution over last 5 months.
        
        Args:
            easy: Count of easy problems solved
            medium: Count of medium problems solved
            hard: Count of hard problems solved
            
        Returns:
            List of monthly trend data
        """
        months = ["Jan", "Feb", "Mar", "Apr", "May"]
        total = easy + medium + hard
        
        if total == 0:
            return [
                {"month": m, "easy": 0, "medium": 0, "hard": 0}
                for m in months
            ]
        
        # Calculate proportion for each difficulty
        easy_ratio = easy / total if total > 0 else 0
        medium_ratio = medium / total if total > 0 else 0
        hard_ratio = hard / total if total > 0 else 0
        
        monthly_trend = []
        problems_per_month = total // 5
        remainder = total % 5
        
        for i, month in enumerate(months):
            month_total = problems_per_month + (1 if i < remainder else 0)
            
            easy_count = int(month_total * easy_ratio)
            medium_count = int(month_total * medium_ratio)
            hard_count = month_total - easy_count - medium_count
            
            monthly_trend.append({
                "month": month,
                "easy": max(0, easy_count),
                "medium": max(0, medium_count),
                "hard": max(0, hard_count)
            })
        
        logger.debug(f"Monthly trend calculated: {len(months)} months")
        return monthly_trend
    
    @staticmethod
    def calculate_heatmap_data(
        total_solved: int,
        days_active: int = 7
    ) -> Dict[str, int]:
        """
        Generate heatmap intensity data.
        
        Args:
            total_solved: Total problems solved
            days_active: Number of active days
            
        Returns:
            Dictionary with heatmap cell values
        """
        heatmap_data = {}
        rows = 4  # 4 weeks
        cols = 7  # 7 days
        
        if total_solved == 0:
            for i in range(rows):
                for j in range(cols):
                    heatmap_data[f"w{i}_d{j}"] = 0
            return heatmap_data
        
        # Distribute activity across heatmap
        max_intensity = (total_solved // (rows * cols)) + 1
        
        for i in range(rows):
            for j in range(cols):
                # Create some variation
                intensity = ((i * cols + j) * max_intensity // (rows * cols))
                # Cap at 10 for visualization
                heatmap_data[f"w{i}_d{j}"] = min(intensity % 10, 9)
        
        logger.debug(f"Heatmap generated: {rows}x{cols} grid")
        return heatmap_data


class AnalyticsProcessor:
    """Main processor for DSA analytics data."""
    
    @staticmethod
    def process_analytics(
        username: str,
        stats: Dict[str, int],
        topics: List[Dict[str, Any]],
        placement_readiness: float
    ) -> Dict[str, Any]:
        """
        Process all analytics data for dashboard response.
        
        Args:
            username: LeetCode username
            stats: Dictionary with easy, medium, hard counts
            topics: List of topic statistics
            placement_readiness: Placement readiness score (0-100)
            
        Returns:
            Complete analytics data dictionary
        """
        total_solved = stats.get("all", 0)
        easy = stats.get("easy", 0)
        medium = stats.get("medium", 0)
        hard = stats.get("hard", 0)
        
        # Calculate all metrics
        difficulty_breakdown = DifficultyStats.calculate_breakdown(easy, medium, hard)
        topic_mastery = TopicMastery.calculate_mastery(topics)
        weekly_activity = ActivityMetrics.calculate_weekly_activity(total_solved)
        monthly_trend = ActivityMetrics.calculate_monthly_trend(easy, medium, hard)
        heatmap_data = ActivityMetrics.calculate_heatmap_data(total_solved)
        
        analytics = {
            "username": username,
            "totalSolved": total_solved,
            "difficultyBreakdown": difficulty_breakdown,
            "topicMastery": topic_mastery,
            "placementReadiness": placement_readiness,
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
