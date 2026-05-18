from typing import Dict, Any, List

# Core repository of pedagogical learning assets
PEDAGOGICAL_RESOURCES: Dict[str, Dict[str, Dict[str, Any]]] = {
    "Arrays": {
        "beginner": {
            "title": "Arrays & Hash Map Foundations",
            "desc": "Master basic array manipulations, static/dynamic allocations, hash table fast lookups, and cumulative prefixes.",
            "url": "/app/notes#arrays-foundations",
            "checklist": ["Static vs Dynamic Arrays", "Hash Map collision strategies", "Two-pointer basics"]
        },
        "intermediate": {
            "title": "Sliding Window & Two-Pointers",
            "desc": "Revise array subarray problems using dynamic and fixed sliding windows, and in-place swapping.",
            "url": "/app/notes#sliding-window",
            "checklist": ["Fixed length sliding window", "Dynamic subarray expansion", "Fast and slow pointers"]
        },
        "advanced": {
            "title": "Intervals & In-place Optimization",
            "desc": "Tackle advanced coordinate compressions, interval sweep-line, and bit manipulation tricks.",
            "url": "/app/notes#intervals-sweep",
            "checklist": ["Sweep-line sorting", "In-place coordinate marking", "Bitmask array representations"]
        }
    },
    "Trees": {
        "beginner": {
            "title": "Binary Tree Recursion Basics",
            "desc": "Learn core definitions, pre-order/in-order/post-order traversals, and mathematical properties of binary trees.",
            "url": "/app/notes#trees-recursion",
            "checklist": ["DFS tree traversals", "BST search and insertion", "Height balancing basics"]
        },
        "intermediate": {
            "title": "BST & Level-Order BFS",
            "desc": "Explore Breadth-First-Search (Level order traversals) and properties of Binary Search Trees.",
            "url": "/app/notes#bst-bfs",
            "checklist": ["BFS using queues", "Lowest Common Ancestor properties", "BST deletion mechanics"]
        },
        "advanced": {
            "title": "Tree Serialization & Advanced Nodes",
            "desc": "Master path-sum maximization, binary trees serialize/deserialize, and Trie structures for autocomplete.",
            "url": "/app/notes#trie-serialization",
            "checklist": ["Tree serialization blueprints", "Suffix/Trie trees", "Tree height calculations"]
        }
    },
    "Graphs": {
        "beginner": {
            "title": "Graph Representations & Basic DFS",
            "desc": "Learn how to represent graphs using adjacency matrices and lists, and perform basic recursive DFS traversals.",
            "url": "/app/notes#graphs-dfs",
            "checklist": ["Adjacency matrix vs Adjacency list", "DFS grid pathfinding", "Connected component counts"]
        },
        "intermediate": {
            "title": "Graph BFS & BFS Pathfinding",
            "desc": "Master Breadth-First-Search (BFS) for shortest path calculations on unweighted grids and graph cloning.",
            "url": "/app/notes#graphs-bfs",
            "checklist": ["Grid BFS boundaries", "Graph copy adjacency mapping", "Cycle detection in undirected graphs"]
        },
        "advanced": {
            "title": "Topological Sort & Advanced Cycles",
            "desc": "Tackle course schedule dependencies, alien dictionary order, topological sorting, and Union-Find configurations.",
            "url": "/app/notes#topo-unionfind",
            "checklist": ["Kahn's Adjacency algorithm", "Disjoint Set Union (DSU) by rank", "Bipartite graph matching"]
        }
    },
    "DP": {
        "beginner": {
            "title": "Recursion to Memoization (Top-down)",
            "desc": "Build strong intuition from standard recursion equations to top-down memoization caches to avoid overlapping computation.",
            "url": "/app/notes#dp-memoization",
            "checklist": ["Fibonacci step memoization", "Grid walking recursion", "Caching decorators"]
        },
        "intermediate": {
            "title": "Tabulation & 1D DP blue prints",
            "desc": "Tackle climbing stairs, house robbing, and 1D array state optimizations using bottom-up tabulations.",
            "url": "/app/notes#dp-tabulation",
            "checklist": ["1D bottom-up transition states", "Space optimization arrays", "Coin change patterns"]
        },
        "advanced": {
            "title": "2D DP & Subsequence Mastery",
            "desc": "Solve complex matrix DP, Longest Common Subsequences, edit distance calculations, and game-theory memoizations.",
            "url": "/app/notes#dp-2d-subsequence",
            "checklist": ["LCS states matrix", "Edit distance transition formulas", "Knapsack state compression"]
        }
    },
    "Strings": {
        "beginner": {
            "title": "String Parsers & Anagram Basics",
            "desc": "Understand how strings are represented, check palindromes, and build hash maps representing character frequencies.",
            "url": "/app/notes#strings-parsers",
            "checklist": ["Two-pointer palindrome check", "Valid anagram hash indexing", "ASCII math manipulations"]
        },
        "intermediate": {
            "title": "Substring sliding windows",
            "desc": "Master longest substrings without repeating characters, and anagram grouping in lists.",
            "url": "/app/notes#strings-window",
            "checklist": ["Sliding window with character maps", "Anagram list aggregations", "Rabin-Karp basic hashing"]
        },
        "advanced": {
            "title": "Window Substring & Pattern Search",
            "desc": "Solve minimum window substring limits and KMP pattern matching algorithms under tight linear constraint.",
            "url": "/app/notes#strings-kmp",
            "checklist": ["Min Window Substring frequency tracking", "KMP prefix-function creation", "Wildcard character matching"]
        }
    }
}

def get_curated_pedagogical_resources(weakest_topic: str, readiness_score: float) -> Dict[str, Any]:
    """
    Selects the exact educational note block matching the user's weakest topic and placement readiness index.
    Categorizes:
    - readiness < 40%: Beginner
    - 40% <= readiness < 75%: Intermediate
    - readiness >= 75%: Advanced
    """
    # Safeguard track name
    topic = weakest_topic if weakest_topic in PEDAGOGICAL_RESOURCES else "Graphs"
    
    # Map tier
    if readiness_score < 40.0:
        tier = "beginner"
    elif readiness_score < 75.0:
        tier = "intermediate"
    else:
        tier = "advanced"

    res = PEDAGOGICAL_RESOURCES[topic][tier]
    
    # Augment with structural rendering properties
    res_augmented = {
        "topic": topic,
        "readinessTier": tier.title(),
        "title": res["title"],
        "desc": res["desc"],
        "path": res["url"],
        "checklist": res["checklist"]
    }
    
    return res_augmented
