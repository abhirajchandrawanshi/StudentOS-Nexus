"""
Activity Metrics Module
Handles activity tracking, trends, and visualizations.
"""

import logging
from typing import Dict, List, Any

logger = logging.getLogger("dsa_activity_metrics")


class ActivityMetricsCalculator:
    """Calculates activity and trend metrics."""
    
    WEEKS_IN_MONTH = 4
    DAYS_IN_WEEK = 7
    MONTHS_IN_TREND = 5
    
    @classmethod
    def calculate_weekly_activity(cls, total_solved: int) -> List[Dict[str, Any]]:
        """
        Distribute solved problems across weekly days.
        
        Args:
            total_solved: Total number of problems solved
            
        Returns:
            List of daily activity data
            
        Example:
            >>> ActivityMetricsCalculator.calculate_weekly_activity(50)
            [
                {'date': 'Mon', 'count': 8},
                {'date': 'Tue', 'count': 8},
                {'date': 'Wed', 'count': 7},
                ...
            ]
        """
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        
        if total_solved == 0:
            logger.debug("No problems solved, returning zero weekly activity")
            return [{"date": day, "count": 0} for day in days]
        
        # Distribute problems with fair division
        base_per_day = total_solved // cls.DAYS_IN_WEEK
        remainder = total_solved % cls.DAYS_IN_WEEK
        
        weekly_activity = []
        for i, day in enumerate(days):
            # Distribute remainder across first days
            count = base_per_day + (1 if i < remainder else 0)
            weekly_activity.append({
                "date": day,
                "count": max(0, count)
            })
        
        logger.debug(f"Weekly activity: {total_solved} problems distributed across 7 days")
        return weekly_activity
    
    @classmethod
    def calculate_monthly_trend(
        cls,
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
            List of monthly trend data with difficulty breakdown
            
        Example:
            >>> ActivityMetricsCalculator.calculate_monthly_trend(50, 60, 20)
            [
                {'month': 'Jan', 'easy': 10, 'medium': 12, 'hard': 4},
                {'month': 'Feb', 'easy': 10, 'medium': 12, 'hard': 4},
                ...
            ]
        """
        months = ["Jan", "Feb", "Mar", "Apr", "May"]
        total = easy + medium + hard
        
        if total == 0:
            logger.debug("No problems solved, returning zero monthly trend")
            return [
                {"month": m, "easy": 0, "medium": 0, "hard": 0}
                for m in months
            ]
        
        # Calculate proportion for each difficulty
        easy_ratio = easy / total
        medium_ratio = medium / total
        hard_ratio = hard / total
        
        monthly_trend = []
        problems_per_month = total // cls.MONTHS_IN_TREND
        remainder = total % cls.MONTHS_IN_TREND
        
        for i, month in enumerate(months):
            # Distribute remainder across first months
            month_total = problems_per_month + (1 if i < remainder else 0)
            
            # Distribute by difficulty ratio
            easy_count = int(month_total * easy_ratio)
            medium_count = int(month_total * medium_ratio)
            hard_count = month_total - easy_count - medium_count
            
            monthly_trend.append({
                "month": month,
                "easy": max(0, easy_count),
                "medium": max(0, medium_count),
                "hard": max(0, hard_count)
            })
        
        logger.debug(f"Monthly trend: {total} problems distributed across {cls.MONTHS_IN_TREND} months")
        return monthly_trend
    
    @classmethod
    def calculate_heatmap_data(cls, total_solved: int) -> Dict[str, int]:
        """
        Generate heatmap intensity data for activity visualization.
        
        Args:
            total_solved: Total problems solved
            
        Returns:
            Dictionary with heatmap cell values (0-9 intensity scale)
            
        Example:
            >>> heatmap = ActivityMetricsCalculator.calculate_heatmap_data(100)
            >>> len(heatmap)
            28  # 4 weeks x 7 days
        """
        heatmap_data = {}
        rows = cls.WEEKS_IN_MONTH  # 4 weeks
        cols = cls.DAYS_IN_WEEK   # 7 days
        
        if total_solved == 0:
            logger.debug("No problems solved, returning zero heatmap")
            for i in range(rows):
                for j in range(cols):
                    heatmap_data[f"w{i}_d{j}"] = 0
            return heatmap_data
        
        # Distribute activity across heatmap with logarithmic scaling
        cells = rows * cols
        max_intensity = min(9, max(1, (total_solved // cells)))
        
        for i in range(rows):
            for j in range(cols):
                # Create realistic distribution
                cell_index = i * cols + j
                base_intensity = (cell_index * max_intensity) // cells
                
                # Add some variance (simulate realistic activity)
                variance = (base_intensity + (cell_index % 3)) % 10
                heatmap_data[f"w{i}_d{j}"] = min(9, variance)
        
        logger.debug(f"Heatmap generated: {rows}x{cols} grid with max intensity {max_intensity}")
        return heatmap_data
    
    @classmethod
    def get_activity_summary(cls, weekly_activity: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate summary statistics from weekly activity.
        
        Args:
            weekly_activity: List of daily activity data
            
        Returns:
            Dictionary with summary statistics
        """
        counts = [a["count"] for a in weekly_activity]
        total = sum(counts)
        avg = total / len(counts) if counts else 0
        max_day = max(counts) if counts else 0
        min_day = min(counts) if counts else 0
        
        summary = {
            "total": total,
            "average": round(avg, 1),
            "peak": max_day,
            "lowest": min_day,
            "activeDay": weekly_activity[counts.index(max_day)]["date"] if max_day > 0 else None
        }
        
        logger.debug(f"Weekly activity summary: {summary}")
        return summary
    
    @classmethod
    def get_trend_summary(cls, monthly_trend: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Generate summary statistics from monthly trend.
        
        Args:
            monthly_trend: List of monthly trend data
            
        Returns:
            Dictionary with trend summary
        """
        total_easy = sum(m["easy"] for m in monthly_trend)
        total_medium = sum(m["medium"] for m in monthly_trend)
        total_hard = sum(m["hard"] for m in monthly_trend)
        total = total_easy + total_medium + total_hard
        
        summary = {
            "totalEasy": total_easy,
            "totalMedium": total_medium,
            "totalHard": total_hard,
            "totalProblems": total,
            "easyPercentage": round((total_easy / total * 100), 1) if total > 0 else 0,
            "mediumPercentage": round((total_medium / total * 100), 1) if total > 0 else 0,
            "hardPercentage": round((total_hard / total * 100), 1) if total > 0 else 0
        }
        
        logger.debug(f"Monthly trend summary: {summary}")
        return summary
