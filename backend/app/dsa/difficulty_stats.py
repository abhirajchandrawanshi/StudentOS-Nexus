"""
Difficulty Statistics Module
Handles difficulty-wise problem breakdown and percentages.
"""

import logging
from typing import Dict, List, Any

logger = logging.getLogger("dsa_difficulty_stats")


class DifficultyBreakdownCalculator:
    """Calculates difficulty distribution statistics."""
    
    DIFFICULTY_CONFIG = {
        "Easy": {
            "color": "#10b981",
            "target": 150,
            "weight": 0.2
        },
        "Medium": {
            "color": "#f59e0b",
            "target": 200,
            "weight": 0.55
        },
        "Hard": {
            "color": "#ef4444",
            "target": 50,
            "weight": 0.25
        }
    }
    
    @classmethod
    def calculate(cls, easy: int, medium: int, hard: int) -> List[Dict[str, Any]]:
        """
        Calculate difficulty breakdown with percentages and colors.
        
        Args:
            easy: Count of easy problems solved
            medium: Count of medium problems solved
            hard: Count of hard problems solved
            
        Returns:
            List of difficulty breakdown objects
            
        Example:
            >>> DifficultyBreakdownCalculator.calculate(45, 60, 15)
            [
                {'difficulty': 'Easy', 'count': 45, 'percentage': 37.5, 'color': '#10b981'},
                {'difficulty': 'Medium', 'count': 60, 'percentage': 50.0, 'color': '#f59e0b'},
                {'difficulty': 'Hard', 'count': 15, 'percentage': 12.5, 'color': '#ef4444'}
            ]
        """
        total = easy + medium + hard
        
        if total == 0:
            logger.debug("No problems solved, returning zero breakdown")
            return cls._zero_breakdown()
        
        breakdown = [
            {
                "difficulty": "Easy",
                "count": easy,
                "percentage": round((easy / total * 100), 1),
                "color": cls.DIFFICULTY_CONFIG["Easy"]["color"]
            },
            {
                "difficulty": "Medium",
                "count": medium,
                "percentage": round((medium / total * 100), 1),
                "color": cls.DIFFICULTY_CONFIG["Medium"]["color"]
            },
            {
                "difficulty": "Hard",
                "count": hard,
                "percentage": round((hard / total * 100), 1),
                "color": cls.DIFFICULTY_CONFIG["Hard"]["color"]
            }
        ]
        
        logger.debug(f"Difficulty breakdown: easy={easy}, medium={medium}, hard={hard} (total={total})")
        return breakdown
    
    @classmethod
    def _zero_breakdown(cls) -> List[Dict[str, Any]]:
        """Return zero breakdown for empty stats."""
        return [
            {"difficulty": d, "count": 0, "percentage": 0.0, "color": cls.DIFFICULTY_CONFIG[d]["color"]}
            for d in ["Easy", "Medium", "Hard"]
        ]
    
    @classmethod
    def calculate_placement_readiness(cls, easy: int, medium: int, hard: int) -> float:
        """
        Calculate placement readiness score based on difficulty distribution.
        
        Args:
            easy: Count of easy problems solved
            medium: Count of medium problems solved
            hard: Count of hard problems solved
            
        Returns:
            Placement readiness score (0-100)
        """
        easy_ratio = min(1.0, easy / cls.DIFFICULTY_CONFIG["Easy"]["target"])
        medium_ratio = min(1.0, medium / cls.DIFFICULTY_CONFIG["Medium"]["target"])
        hard_ratio = min(1.0, hard / cls.DIFFICULTY_CONFIG["Hard"]["target"])
        
        readiness = (
            easy_ratio * cls.DIFFICULTY_CONFIG["Easy"]["weight"] * 100 +
            medium_ratio * cls.DIFFICULTY_CONFIG["Medium"]["weight"] * 100 +
            hard_ratio * cls.DIFFICULTY_CONFIG["Hard"]["weight"] * 100
        )
        
        readiness = round(min(100, readiness), 1)
        logger.debug(f"Placement readiness: {readiness}%")
        return readiness
    
    @classmethod
    def get_difficulty_color(cls, difficulty: str) -> str:
        """Get color for a difficulty level."""
        return cls.DIFFICULTY_CONFIG.get(difficulty, {}).get("color", "#7C3AED")
    
    @classmethod
    def get_difficulty_stats(cls) -> Dict[str, Dict[str, Any]]:
        """Get configuration for all difficulty levels."""
        return cls.DIFFICULTY_CONFIG.copy()
