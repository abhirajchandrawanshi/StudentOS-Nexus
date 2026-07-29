import logging
from typing import Dict, Any

from app.dsa.graphql_client import execute_query
from app.dsa.graphql_queries import PROFILE_QUERY
from app.dsa.graphql_parser import merge_profile

logger = logging.getLogger("leetcode_service")


class LeetCodeServiceError(Exception):
    """Raised when live LeetCode data cannot be fetched safely."""


class LeetCodeUserNotFoundError(LeetCodeServiceError):
    """Raised when LeetCode returns no matched user for a username."""


async def fetch_leetcode_profile(username: str) -> Dict[str, Any]:
    """
    Fetches a user's LeetCode profile and converts it into
    the standardized StudentOS profile.
    """

    logger.info(f"Fetching LeetCode profile for '{username}'")

    try:
        # Execute GraphQL query
        response = await execute_query(
            PROFILE_QUERY,
            {"username": username}
        )

        # Handle GraphQL errors
        if response.get("errors"):
            logger.error(
                "GraphQL Error while fetching '%s': %s",
                username,
                response["errors"]
            )
            raise LeetCodeServiceError("LeetCode returned GraphQL errors.")

        # Extract matched user
        matched_user = (
            response
            .get("data", {})
            .get("matchedUser")
        )

        if matched_user is None:
            logger.warning(
                "LeetCode user '%s' not found.",
                username
            )
            raise LeetCodeUserNotFoundError(
                f"LeetCode user '{username}' was not found."
            )

        # Convert raw GraphQL response to StudentOS model
        profile = merge_profile(matched_user)

        logger.info(
            "Successfully fetched profile for '%s'",
            username
        )

        logger.debug("Parsed Profile: %s", profile)

        return profile

    except Exception as e:
        if isinstance(e, LeetCodeServiceError):
            raise

        logger.exception(
            "Failed to fetch profile for '%s': %s",
            username,
            e
        )

        raise LeetCodeServiceError(
            "Could not fetch live LeetCode profile. Please try again."
        ) from e


def create_default_profile(username: str) -> Dict[str, Any]:
    """
    Returns a default StudentOS profile when
    LeetCode data cannot be fetched.
    """

    return {
        "username": username,

        "profile": {
            "realName": username,
            "avatar": None,
            "ranking": 0
        },

        "stats": {
            "all": 0,
            "easy": 0,
            "medium": 0,
            "hard": 0
        },

        "topics": [],

        "contest": {
            "rating": 0,
            "globalRanking": 0,
            "topPercentage": 0,
            "contestsAttended": 0
        },

        "recentSubmissions": [],

        "submissionCalendar": {}
    }
