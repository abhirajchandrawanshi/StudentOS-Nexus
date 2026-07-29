import logging
from typing import Dict, Any

import httpx

logger = logging.getLogger("graphql_client")

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql"

LEETCODE_HEADERS = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Origin": "https://leetcode.com",
    "Referer": "https://leetcode.com/",
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/126.0.0.0 Safari/537.36"
    ),
}


async def execute_query(
    query: str,
    variables: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Execute a GraphQL query against the LeetCode API.
    """

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:

            response = await client.post(
                LEETCODE_GRAPHQL_URL,
                json={
                    "query": query,
                    "variables": variables
                },
                headers=LEETCODE_HEADERS
            )

        response.raise_for_status()

        # Parse JSON response
        response_json = response.json()

        logger.info("GraphQL query executed successfully.")

        return response_json

    except httpx.HTTPStatusError as e:
        logger.error(
            f"HTTP Error {e.response.status_code}: {e.response.text}"
        )
        raise

    except httpx.RequestError as e:
        logger.error(f"Network Error: {e}")
        raise

    except Exception as e:
        logger.exception(f"Unexpected GraphQL Client Error: {e}")
        raise
