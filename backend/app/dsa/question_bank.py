from typing import List, Dict, Any

# Curated dataset of standard high-quality LeetCode problems
# mapped by topic tracks with company tags and direct problem links.
CURATED_QUESTION_BANK = [
    # ─── ARRAYS ──────────────────────────────────────────────────────────
    {
        "id": 1,
        "title": "Two Sum",
        "titleSlug": "two-sum",
        "difficulty": "Easy",
        "topic": "Arrays",
        "companyTags": ["Amazon", "Google", "Razorpay", "Startups"],
        "url": "https://leetcode.com/problems/two-sum/",
        "rating": 1200
    },
    {
        "id": 121,
        "title": "Best Time to Buy and Sell Stock",
        "titleSlug": "best-time-to-buy-and-sell-stock",
        "difficulty": "Easy",
        "topic": "Arrays",
        "companyTags": ["Amazon", "Razorpay", "Startups"],
        "url": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
        "rating": 1250
    },
    {
        "id": 238,
        "title": "Product of Array Except Self",
        "titleSlug": "product-of-array-except-self",
        "difficulty": "Medium",
        "topic": "Arrays",
        "companyTags": ["Amazon", "Google", "Atlassian"],
        "url": "https://leetcode.com/problems/product-of-array-except-self/",
        "rating": 1400
    },
    {
        "id": 53,
        "title": "Maximum Subarray",
        "titleSlug": "maximum-subarray",
        "difficulty": "Medium",
        "topic": "Arrays",
        "companyTags": ["Amazon", "Google", "Startups"],
        "url": "https://leetcode.com/problems/maximum-subarray/",
        "rating": 1350
    },
    {
        "id": 56,
        "title": "Merge Intervals",
        "titleSlug": "merge-intervals",
        "difficulty": "Medium",
        "topic": "Arrays",
        "companyTags": ["Google", "Atlassian", "Razorpay"],
        "url": "https://leetcode.com/problems/merge-intervals/",
        "rating": 1450
    },
    {
        "id": 15,
        "title": "3Sum",
        "titleSlug": "3sum",
        "difficulty": "Medium",
        "topic": "Arrays",
        "companyTags": ["Amazon", "Google", "Razorpay"],
        "url": "https://leetcode.com/problems/3sum/",
        "rating": 1400
    },
    {
        "id": 41,
        "title": "First Missing Positive",
        "titleSlug": "first-missing-positive",
        "difficulty": "Hard",
        "topic": "Arrays",
        "companyTags": ["Google", "Amazon", "Startups"],
        "url": "https://leetcode.com/problems/first-missing-positive/",
        "rating": 1700
    },
    {
        "id": 4,
        "title": "Median of Two Sorted Arrays",
        "titleSlug": "median-of-two-sorted-arrays",
        "difficulty": "Hard",
        "topic": "Arrays",
        "companyTags": ["Google", "Amazon"],
        "url": "https://leetcode.com/problems/median-of-two-sorted-arrays/",
        "rating": 1800
    },

    # ─── TREES ───────────────────────────────────────────────────────────
    {
        "id": 226,
        "title": "Invert Binary Tree",
        "titleSlug": "invert-binary-tree",
        "difficulty": "Easy",
        "topic": "Trees",
        "companyTags": ["Google", "Amazon", "Startups"],
        "url": "https://leetcode.com/problems/invert-binary-tree/",
        "rating": 1100
    },
    {
        "id": 104,
        "title": "Maximum Depth of Binary Tree",
        "titleSlug": "maximum-depth-of-binary-tree",
        "difficulty": "Easy",
        "topic": "Trees",
        "companyTags": ["Amazon", "Startups"],
        "url": "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
        "rating": 1050
    },
    {
        "id": 102,
        "title": "Binary Tree Level Order Traversal",
        "titleSlug": "binary-tree-level-order-traversal",
        "difficulty": "Medium",
        "topic": "Trees",
        "companyTags": ["Amazon", "Google", "Razorpay"],
        "url": "https://leetcode.com/problems/binary-tree-level-order-traversal/",
        "rating": 1300
    },
    {
        "id": 236,
        "title": "Lowest Common Ancestor of a Binary Tree",
        "titleSlug": "lowest-common-ancestor-of-a-binary-tree",
        "difficulty": "Medium",
        "topic": "Trees",
        "companyTags": ["Amazon", "Google", "Atlassian"],
        "url": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
        "rating": 1400
    },
    {
        "id": 98,
        "title": "Validate Binary Search Tree",
        "titleSlug": "validate-binary-search-tree",
        "difficulty": "Medium",
        "topic": "Trees",
        "companyTags": ["Amazon", "Google", "Razorpay"],
        "url": "https://leetcode.com/problems/validate-binary-search-tree/",
        "rating": 1350
    },
    {
        "id": 105,
        "title": "Construct Binary Tree from Preorder and Inorder Traversal",
        "titleSlug": "construct-binary-tree-from-preorder-and-inorder-traversal",
        "difficulty": "Medium",
        "topic": "Trees",
        "companyTags": ["Google", "Amazon", "Atlassian"],
        "url": "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/",
        "rating": 1500
    },
    {
        "id": 124,
        "title": "Binary Tree Maximum Path Sum",
        "titleSlug": "binary-tree-maximum-path-sum",
        "difficulty": "Hard",
        "topic": "Trees",
        "companyTags": ["Google", "Amazon", "Startups"],
        "url": "https://leetcode.com/problems/binary-tree-maximum-path-sum/",
        "rating": 1750
    },
    {
        "id": 297,
        "title": "Serialize and Deserialize Binary Tree",
        "titleSlug": "serialize-and-deserialize-binary-tree",
        "difficulty": "Hard",
        "topic": "Trees",
        "companyTags": ["Google", "Amazon", "Atlassian"],
        "url": "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/",
        "rating": 1800
    },

    # ─── GRAPHS ──────────────────────────────────────────────────────────
    {
        "id": 200,
        "title": "Number of Islands",
        "titleSlug": "number-of-islands",
        "difficulty": "Medium",
        "topic": "Graphs",
        "companyTags": ["Amazon", "Google", "Razorpay", "Startups"],
        "url": "https://leetcode.com/problems/number-of-islands/",
        "rating": 1300
    },
    {
        "id": 133,
        "title": "Clone Graph",
        "titleSlug": "clone-graph",
        "difficulty": "Medium",
        "topic": "Graphs",
        "companyTags": ["Amazon", "Google", "Startups"],
        "url": "https://leetcode.com/problems/clone-graph/",
        "rating": 1350
    },
    {
        "id": 207,
        "title": "Course Schedule",
        "titleSlug": "course-schedule",
        "difficulty": "Medium",
        "topic": "Graphs",
        "companyTags": ["Google", "Amazon", "Atlassian"],
        "url": "https://leetcode.com/problems/course-schedule/",
        "rating": 1400
    },
    {
        "id": 417,
        "title": "Pacific Atlantic Water Flow",
        "titleSlug": "pacific-atlantic-water-flow",
        "difficulty": "Medium",
        "topic": "Graphs",
        "companyTags": ["Google", "Amazon"],
        "url": "https://leetcode.com/problems/pacific-atlantic-water-flow/",
        "rating": 1450
    },
    {
        "id": 323,
        "title": "Number of Connected Components in an Undirected Graph",
        "titleSlug": "number-of-connected-components-in-an-undirected-graph",
        "difficulty": "Medium",
        "topic": "Graphs",
        "companyTags": ["Amazon", "Google", "Startups"],
        "url": "https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/",
        "rating": 1400
    },
    {
        "id": 269,
        "title": "Alien Dictionary",
        "titleSlug": "alien-dictionary",
        "difficulty": "Hard",
        "topic": "Graphs",
        "companyTags": ["Google", "Amazon", "Atlassian"],
        "url": "https://leetcode.com/problems/alien-dictionary/",
        "rating": 1850
    },
    {
        "id": 127,
        "title": "Word Ladder",
        "titleSlug": "word-ladder",
        "difficulty": "Hard",
        "topic": "Graphs",
        "companyTags": ["Google", "Amazon", "Razorpay"],
        "url": "https://leetcode.com/problems/word-ladder/",
        "rating": 1750
    },

    # ─── DYNAMIC PROGRAMMING ─────────────────────────────────────────────
    {
        "id": 70,
        "title": "Climbing Stairs",
        "titleSlug": "climbing-stairs",
        "difficulty": "Easy",
        "topic": "DP",
        "companyTags": ["Amazon", "Razorpay", "Startups"],
        "url": "https://leetcode.com/problems/climbing-stairs/",
        "rating": 1050
    },
    {
        "id": 322,
        "title": "Coin Change",
        "titleSlug": "coin-change",
        "difficulty": "Medium",
        "topic": "DP",
        "companyTags": ["Google", "Amazon", "Atlassian", "Startups"],
        "url": "https://leetcode.com/problems/coin-change/",
        "rating": 1400
    },
    {
        "id": 300,
        "title": "Longest Increasing Subsequence",
        "titleSlug": "longest-increasing-subsequence",
        "difficulty": "Medium",
        "topic": "DP",
        "companyTags": ["Google", "Amazon", "Razorpay"],
        "url": "https://leetcode.com/problems/longest-increasing-subsequence/",
        "rating": 1450
    },
    {
        "id": 1143,
        "title": "Longest Common Subsequence",
        "titleSlug": "longest-common-subsequence",
        "difficulty": "Medium",
        "topic": "DP",
        "companyTags": ["Google", "Amazon", "Atlassian"],
        "url": "https://leetcode.com/problems/longest-common-subsequence/",
        "rating": 1400
    },
    {
        "id": 139,
        "title": "Word Break",
        "titleSlug": "word-break",
        "difficulty": "Medium",
        "topic": "DP",
        "companyTags": ["Google", "Amazon", "Startups"],
        "url": "https://leetcode.com/problems/word-break/",
        "rating": 1450
    },
    {
        "id": 198,
        "title": "House Robber",
        "titleSlug": "house-robber",
        "difficulty": "Medium",
        "topic": "DP",
        "companyTags": ["Amazon", "Razorpay", "Startups"],
        "url": "https://leetcode.com/problems/house-robber/",
        "rating": 1300
    },
    {
        "id": 72,
        "title": "Edit Distance",
        "titleSlug": "edit-distance",
        "difficulty": "Hard",
        "topic": "DP",
        "companyTags": ["Google", "Amazon", "Atlassian"],
        "url": "https://leetcode.com/problems/edit-distance/",
        "rating": 1650
    },
    {
        "id": 44,
        "title": "Wildcard Matching",
        "titleSlug": "wildcard-matching",
        "difficulty": "Hard",
        "topic": "DP",
        "companyTags": ["Google", "Amazon"],
        "url": "https://leetcode.com/problems/wildcard-matching/",
        "rating": 1800
    },

    # ─── STRINGS ─────────────────────────────────────────────────────────
    {
        "id": 242,
        "title": "Valid Anagram",
        "titleSlug": "valid-anagram",
        "difficulty": "Easy",
        "topic": "Strings",
        "companyTags": ["Amazon", "Startups"],
        "url": "https://leetcode.com/problems/valid-anagram/",
        "rating": 1050
    },
    {
        "id": 125,
        "title": "Valid Palindrome",
        "titleSlug": "valid-palindrome",
        "difficulty": "Easy",
        "topic": "Strings",
        "companyTags": ["Amazon", "Razorpay", "Startups"],
        "url": "https://leetcode.com/problems/valid-palindrome/",
        "rating": 1100
    },
    {
        "id": 49,
        "title": "Group Anagrams",
        "titleSlug": "group-anagrams",
        "difficulty": "Medium",
        "topic": "Strings",
        "companyTags": ["Amazon", "Google", "Startups"],
        "url": "https://leetcode.com/problems/group-anagrams/",
        "rating": 1300
    },
    {
        "id": 3,
        "title": "Longest Substring Without Repeating Characters",
        "titleSlug": "longest-substring-without-repeating-characters",
        "difficulty": "Medium",
        "topic": "Strings",
        "companyTags": ["Google", "Amazon", "Atlassian", "Razorpay"],
        "url": "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
        "rating": 1350
    },
    {
        "id": 5,
        "title": "Longest Palindromic Substring",
        "titleSlug": "longest-palindromic-substring",
        "difficulty": "Medium",
        "topic": "Strings",
        "companyTags": ["Google", "Amazon", "Startups"],
        "url": "https://leetcode.com/problems/longest-palindromic-substring/",
        "rating": 1400
    },
    {
        "id": 76,
        "title": "Minimum Window Substring",
        "titleSlug": "minimum-window-substring",
        "difficulty": "Hard",
        "topic": "Strings",
        "companyTags": ["Google", "Amazon", "Atlassian"],
        "url": "https://leetcode.com/problems/minimum-window-substring/",
        "rating": 1750
    }
]

def get_questions_by_topic(topic: str) -> List[Dict[str, Any]]:
    """
    Returns list of all questions matching a specific topic track (case-insensitive).
    """
    normalized_topic = topic.strip().lower()
    return [q for q in CURATED_QUESTION_BANK if q["topic"].lower() == normalized_topic]

def get_all_questions() -> List[Dict[str, Any]]:
    """
    Returns the complete list of curated questions.
    """
    return CURATED_QUESTION_BANK
