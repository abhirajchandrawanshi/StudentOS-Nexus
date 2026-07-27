import asyncio
import logging
from typing import Dict, Any,Optional
import httpx

logger = logging.getLogger("leetcode_service")

# LeetCode GraphQL Endpoint
LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

# Mock profile dataset (used only if API fails)
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
    Fetches a LeetCode profile using the official GraphQL endpoint.
    Falls back to mock/default data if the API is unavailable.
    """

    logger.info(f"Fetching LeetCode profile for '{username}'")

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

    payload = {
        "query": query,
        "variables": {
            "username": username
        }
    }

    try:

        async with httpx.AsyncClient(timeout=15.0) as client:

            response = await client.post(
                LEETCODE_GRAPHQL_URL,
                json=payload,
                headers={
                    "Content-Type": "application/json"
                }
            )

        if response.status_code != 200:
            logger.warning(
                f"LeetCode returned HTTP {response.status_code}"
            )
            return MOCK_PROFILES.get(
                username,
                create_default_profile(username)
            )

        data = response.json()

        if data.get("errors"):
            logger.warning(
                f"GraphQL returned errors: {data['errors']}"
            )
            return MOCK_PROFILES.get(
                username,
                create_default_profile(username)
            )

        matched_user = data.get("data", {}).get("matchedUser")

        if matched_user is None:
            logger.warning(f"User '{username}' not found.")
            return create_default_profile(username)

        logger.info(f"Successfully fetched profile for '{username}'")

        return matched_user

    except httpx.TimeoutException:
        logger.warning("LeetCode request timed out.")

    except httpx.RequestError as e:
        logger.error(f"Network error: {e}")

    except Exception as e:
        logger.exception(f"Unexpected error: {e}")

    # Fallback
    return MOCK_PROFILES.get(
        username,
        create_default_profile(username)
    )


def create_default_profile(username: str) -> Dict[str, Any]:
    """
    Creates a default profile when LeetCode data
    cannot be retrieved.
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
    Synchronous wrapper for backward compatibility.
    """

    try:
        loop = asyncio.get_event_loop()

    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    return loop.run_until_complete(
        fetch_leetcode_profile(username)
    )