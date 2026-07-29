"""
Topic Mastery Module
Handles topic-wise progress tracking and mastery calculations.
"""

import logging
from typing import Dict, List, Any

logger = logging.getLogger("dsa_topic_mastery")


class TopicMasteryCalculator:
    """Calculates topic mastery and progress."""
    
    @classmethod
    def calculate_mastery(cls, topics: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Calculate topic mastery with percentages and colors.
        
        Args:
            topics: List of topic stats from analytics engine
            Format: [
                {
                    "topic": "Arrays",
                    "solved": 45,
                    "total": 50,
                    "color": "#6366f1"
                },
                ...
            ]
            
        Returns:
            Sorted list of topic mastery objects
            
        Example:
            >>> topics = [
            ...     {"topic": "Arrays", "solved": 45, "total": 50, "color": "#6366f1"},
            ...     {"topic": "Graphs", "solved": 12, "total": 40, "color": "#ec4899"}
            ... ]
            >>> TopicMasteryCalculator.calculate_mastery(topics)
            [
                {'name': 'Arrays', 'solved': 45, 'total': 50, 'percentage': 90.0, 'color': '#6366f1'},
                {'name': 'Graphs', 'solved': 12, 'total': 40, 'percentage': 30.0, 'color': '#ec4899'}
            ]
        """
        topic_mastery = []
        
        for topic in topics:
            total = topic.get("total", 0)
            solved = topic.get("solved", 0)
            
            percentage = round((solved / total * 100), 1) if total > 0 else 0.0
            
            topic_mastery.append({
                "name": topic.get("topic", "Unknown"),
                "solved": solved,
                "total": total,
                "percentage": percentage,
                "color": topic.get("color", "#7C3AED")
            })
        
        # Sort by percentage descending (highest mastery first)
        topic_mastery.sort(key=lambda x: x["percentage"], reverse=True)
        
        logger.debug(f"Topic mastery calculated for {len(topic_mastery)} topics")
        return topic_mastery
    
    @classmethod
    def get_weak_topics(cls, topics: List[Dict[str, Any]], threshold: float = 50.0) -> List[Dict[str, Any]]:
        """
        Get topics where mastery is below threshold.
        
        Args:
            topics: List of calculated topic mastery objects
            threshold: Percentage threshold for weak topics (default 50%)
            
        Returns:
            List of weak topics sorted by percentage
        """
        weak = [t for t in topics if t["percentage"] < threshold]
        weak.sort(key=lambda x: x["percentage"])
        
        logger.debug(f"Found {len(weak)} weak topics (below {threshold}%)")
        return weak
    
    @classmethod
    def get_strong_topics(cls, topics: List[Dict[str, Any]], threshold: float = 75.0) -> List[Dict[str, Any]]:
        """
        Get topics where mastery is above threshold.
        
        Args:
            topics: List of calculated topic mastery objects
            threshold: Percentage threshold for strong topics (default 75%)
            
        Returns:
            List of strong topics sorted by percentage descending
        """
        strong = [t for t in topics if t["percentage"] >= threshold]
        strong.sort(key=lambda x: x["percentage"], reverse=True)
        
        logger.debug(f"Found {len(strong)} strong topics (above {threshold}%)")
        return strong
    
    @classmethod
    def calculate_overall_mastery(cls, topics: List[Dict[str, Any]]) -> float:
        """
        Calculate overall mastery across all topics.
        
        Args:
            topics: List of calculated topic mastery objects
            
        Returns:
            Overall mastery percentage
        """
        if not topics:
            return 0.0
        
        total_solved = sum(t["solved"] for t in topics)
        total_problems = sum(t["total"] for t in topics)
        
        overall = round((total_solved / total_problems * 100), 1) if total_problems > 0 else 0.0
        
        logger.debug(f"Overall mastery: {overall}% ({total_solved}/{total_problems})")
        return overall
    
    @classmethod
    def get_mastery_level(cls, percentage: float) -> str:
        """
        Get mastery level label for a percentage.
        
        Args:
            percentage: Mastery percentage
            
        Returns:
            Mastery level string
        """
        if percentage >= 90:
            return "Expert"
        elif percentage >= 75:
            return "Advanced"
        elif percentage >= 50:
            return "Intermediate"
        elif percentage >= 25:
            return "Beginner"
        else:
            return "Novice"
    
    @classmethod
    def format_topic_list(cls, topics: List[Dict[str, Any]], limit: int = 6) -> List[str]:
        """
        Format topics as simple list of names.
        
        Args:
            topics: List of calculated topic mastery objects
            limit: Maximum number of topics to return
            
        Returns:
            List of topic names
        """
        return [t["name"] for t in topics[:limit]]
