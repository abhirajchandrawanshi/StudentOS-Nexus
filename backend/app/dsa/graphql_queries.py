# app/dsa/graphql_queries.py

PROFILE_QUERY = """
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