import httpx
import logging
from typing import Dict, Any, Optional
import asyncio

logger = logging.getLogger("leetcode_service")

# LeetCode GraphQL endpoint
LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

# Mock profile dataset for testing/offline usage
MOCK_PROFILES = {
    "abhiraj_chandrawanshi": {
        "username": "abhiraj_chandrawanshi",
        "profile": {
            "realName": "Abhiraj Chandrawanshi",
            "userAvatar": "https://assets.leetcode.com/users/abhiraj_chandrawanshi/avatar_1234567890.png",
            "ranking": 12345
        },
        "submitStats": {
            "acSubmissionNum": [
                {"difficulty": "All", "count": 87},
                {"difficulty": "Easy", "count": 45},
                {"difficulty": "Medium", "count": 35},
                {"difficulty": "Hard", "count": 7}
            ]
        },
        "tagProblemCounts": {
            "fundamental": [
                {"tagSlug": "array", "tagName": "Array", "problemsSolved": 12},
                {"tagSlug": "string", "tagName": "String", "problemsSolved": 8},
                {"tagSlug": "hash-table", "tagName": "Hash Table", "problemsSolved": 10}
            ],
            "intermediate": [
                {"tagSlug": "binary-search", "tagName": "Binary Search", "problemsSolved": 5},
                {"tagSlug": "dynamic-programming", "tagName": "Dynamic Programming", "problemsSolved": 6}
            ],
            "advanced": [
                {"tagSlug": "graph", "tagName": "Graph", "problemsSolved": 4},
                {"tagSlug": "tree", "tagName": "Tree", "problemsSolved": 7}
            ]
        }
    }
}


async def fetch_leetcode_profile(username: str) -> Dict[str, Any]:
    """
    Fetches LeetCode profile data using GraphQL API.
    Falls back to mock data if API call fails or user not found.
    """
    logger.info(f"Fetching LeetCode profile for: {username}")
    
    # Check if we have mock data for this user
    if username in MOCK_PROFILES:
        logger.info(f"Using mock profile for {username}")
        return MOCK_PROFILES[username]
    
    # Try to fetch from LeetCode API
    query = """
    query getUserProfile($username: String!) {
        matchedUser(username: $username) {
            username
            profile {
                realName
                userAvatar
                ranking
            }
            submitStats: submitStatsGlobal {
                acSubmissionNum {
                    difficulty
                    count
                }
            }
            tagProblemCounts {
                fundamental {
                    tagSlug
                    tagName
                    problemsSolved
                }
                intermediate {
                    tagSlug
                    tagName
                    problemsSolved
                }
                advanced {
                    tagSlug
                    tagName
                    problemsSolved
                }
            }
        }
    }
    """
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                LEETCODE_GRAPHQL_URL,
                json={"query": query, "variables": {"username": username}},
                headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                    "Referer": "https://leetcode.com/"
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                if "data" in data and data["data"].get("matchedUser"):
                    logger.info(f"Successfully fetched LeetCode profile for {username}")
                    return data["data"]["matchedUser"]
                else:
                    logger.warning(f"User {username} not found on LeetCode")
                    # Return default mock data
                    return create_default_profile(username)
            else:
                logger.warning(f"LeetCode API returned status {response.status_code}")
                return create_default_profile(username)
                
    except httpx.TimeoutException:
        logger.warning(f"LeetCode API timeout for user {username}")
        return create_default_profile(username)
    except Exception as e:
        logger.error(f"Error fetching LeetCode profile: {e}")
        return create_default_profile(username)


def create_default_profile(username: str) -> Dict[str, Any]:
    """
    Creates a default profile structure for users not found or API failures.
    """
    return {
        "username": username,
        "profile": {
            "realName": username,
            "userAvatar": None,
            "ranking": 0
        },
        "submitStats": {
            "acSubmissionNum": [
                {"difficulty": "All", "count": 0},
                {"difficulty": "Easy", "count": 0},
                {"difficulty": "Medium", "count": 0},
                {"difficulty": "Hard", "count": 0}
            ]
        },
        "tagProblemCounts": {
            "fundamental": [],
            "intermediate": [],
            "advanced": []
        }
    }


def get_user_profile(username: str):
    """
    Synchronous wrapper for fetch_leetcode_profile for backward compatibility.
    """
    # Use asyncio.run to execute async function in sync context
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(fetch_leetcode_profile(username))