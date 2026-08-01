import json
from pathlib import Path

path = Path('app/dsa/data/questions.json')
with path.open('r', encoding='utf-8') as handle:
    data = json.load(handle)

extra = [
    {"id": 141, "title": "Pacific Atlantic Water Flow", "leetcode_slug": "pacific-atlantic-water-flow", "difficulty": "Medium", "topics": ["Graphs", "DFS"], "companies": ["Amazon", "Google"], "frequency_score": 93, "premium": False, "url": "https://leetcode.com/problems/pacific-atlantic-water-flow/"},
    {"id": 142, "title": "Word Search", "leetcode_slug": "word-search", "difficulty": "Medium", "topics": ["Backtracking", "Graphs"], "companies": ["Microsoft", "Meta"], "frequency_score": 92, "premium": False, "url": "https://leetcode.com/problems/word-search/"},
    {"id": 143, "title": "Game of Life", "leetcode_slug": "game-of-life", "difficulty": "Medium", "topics": ["Arrays", "Simulation"], "companies": ["Amazon", "Meta"], "frequency_score": 91, "premium": False, "url": "https://leetcode.com/problems/game-of-life/"},
    {"id": 144, "title": "Spiral Matrix", "leetcode_slug": "spiral-matrix", "difficulty": "Medium", "topics": ["Arrays", "Simulation"], "companies": ["Google", "Microsoft"], "frequency_score": 90, "premium": False, "url": "https://leetcode.com/problems/spiral-matrix/"},
    {"id": 145, "title": "Rotate Image", "leetcode_slug": "rotate-image", "difficulty": "Medium", "topics": ["Arrays", "Matrix"], "companies": ["Amazon", "Microsoft"], "frequency_score": 89, "premium": False, "url": "https://leetcode.com/problems/rotate-image/"},
    {"id": 146, "title": "Set Matrix Zeroes", "leetcode_slug": "set-matrix-zeroes", "difficulty": "Medium", "topics": ["Arrays", "Matrix"], "companies": ["Google", "Meta"], "frequency_score": 88, "premium": False, "url": "https://leetcode.com/problems/set-matrix-zeroes/"},
    {"id": 147, "title": "Pascals Triangle", "leetcode_slug": "pascals-triangle", "difficulty": "Easy", "topics": ["Arrays", "DP"], "companies": ["Amazon", "Microsoft"], "frequency_score": 87, "premium": False, "url": "https://leetcode.com/problems/pascals-triangle/"},
    {"id": 148, "title": "Pascals Triangle II", "leetcode_slug": "pascals-triangle-ii", "difficulty": "Easy", "topics": ["Arrays", "DP"], "companies": ["Google", "Meta"], "frequency_score": 86, "premium": False, "url": "https://leetcode.com/problems/pascals-triangle-ii/"},
    {"id": 149, "title": "Maximum Gap", "leetcode_slug": "maximum-gap", "difficulty": "Hard", "topics": ["Arrays", "Sorting"], "companies": ["Amazon", "Microsoft"], "frequency_score": 85, "premium": False, "url": "https://leetcode.com/problems/maximum-gap/"},
    {"id": 150, "title": "H-Index", "leetcode_slug": "h-index", "difficulty": "Medium", "topics": ["Arrays", "Sorting"], "companies": ["Google", "Meta"], "frequency_score": 84, "premium": False, "url": "https://leetcode.com/problems/h-index/"},
    {"id": 151, "title": "Insert Delete GetRandom O(1)", "leetcode_slug": "insert-delete-getrandom-o1", "difficulty": "Medium", "topics": ["Design", "HashMap"], "companies": ["Amazon", "Google"], "frequency_score": 83, "premium": False, "url": "https://leetcode.com/problems/insert-delete-getrandom-o1/"},
    {"id": 152, "title": "Randomized Set", "leetcode_slug": "randomized-set", "difficulty": "Medium", "topics": ["Design", "HashMap"], "companies": ["Microsoft", "Meta"], "frequency_score": 82, "premium": False, "url": "https://leetcode.com/problems/randomized-set/"},
    {"id": 153, "title": "Serialize and Deserialize BST", "leetcode_slug": "serialize-and-deserialize-bst", "difficulty": "Medium", "topics": ["Trees", "Design"], "companies": ["Amazon", "Google"], "frequency_score": 81, "premium": False, "url": "https://leetcode.com/problems/serialize-and-deserialize-bst/"},
    {"id": 154, "title": "Convert Sorted Array to Binary Search Tree", "leetcode_slug": "convert-sorted-array-to-binary-search-tree", "difficulty": "Easy", "topics": ["Trees", "Binary Search Tree"], "companies": ["Microsoft", "Meta"], "frequency_score": 80, "premium": False, "url": "https://leetcode.com/problems/convert-sorted-array-to-binary-search-tree/"},
    {"id": 155, "title": "Convert Sorted List to Binary Search Tree", "leetcode_slug": "convert-sorted-list-to-binary-search-tree", "difficulty": "Medium", "topics": ["Trees", "Linked List"], "companies": ["Amazon", "Google"], "frequency_score": 79, "premium": False, "url": "https://leetcode.com/problems/convert-sorted-list-to-binary-search-tree/"},
    {"id": 156, "title": "Balanced Binary Tree", "leetcode_slug": "balanced-binary-tree", "difficulty": "Easy", "topics": ["Trees", "DFS"], "companies": ["Microsoft", "Meta"], "frequency_score": 78, "premium": False, "url": "https://leetcode.com/problems/balanced-binary-tree/"},
    {"id": 157, "title": "Flatten Nested List Iterator", "leetcode_slug": "flatten-nested-list-iterator", "difficulty": "Medium", "topics": ["Design", "Stack"], "companies": ["Amazon", "Google"], "frequency_score": 77, "premium": False, "url": "https://leetcode.com/problems/flatten-nested-list-iterator/"},
    {"id": 158, "title": "Nested List Weight Sum", "leetcode_slug": "nested-list-weight-sum", "difficulty": "Easy", "topics": ["DFS", "Design"], "companies": ["Microsoft", "Meta"], "frequency_score": 76, "premium": False, "url": "https://leetcode.com/problems/nested-list-weight-sum/"},
    {"id": 159, "title": "Reorder List", "leetcode_slug": "reorder-list", "difficulty": "Medium", "topics": ["Linked List", "Two Pointers"], "companies": ["Amazon", "Google"], "frequency_score": 75, "premium": False, "url": "https://leetcode.com/problems/reorder-list/"},
    {"id": 160, "title": "Remove Nth Node From End of List", "leetcode_slug": "remove-nth-node-from-end-of-list", "difficulty": "Medium", "topics": ["Linked List", "Two Pointers"], "companies": ["Microsoft", "Meta"], "frequency_score": 74, "premium": False, "url": "https://leetcode.com/problems/remove-nth-node-from-end-of-list/"},
    {"id": 161, "title": "Swap Nodes in Pairs", "leetcode_slug": "swap-nodes-in-pairs", "difficulty": "Medium", "topics": ["Linked List", "Recursion"], "companies": ["Amazon", "Google"], "frequency_score": 73, "premium": False, "url": "https://leetcode.com/problems/swap-nodes-in-pairs/"},
    {"id": 162, "title": "Palindrome Linked List", "leetcode_slug": "palindrome-linked-list", "difficulty": "Easy", "topics": ["Linked List", "Two Pointers"], "companies": ["Microsoft", "Meta"], "frequency_score": 72, "premium": False, "url": "https://leetcode.com/problems/palindrome-linked-list/"},
    {"id": 163, "title": "Intersection of Two Linked Lists", "leetcode_slug": "intersection-of-two-linked-lists", "difficulty": "Easy", "topics": ["Linked List"], "companies": ["Amazon", "Google"], "frequency_score": 71, "premium": False, "url": "https://leetcode.com/problems/intersection-of-two-linked-lists/"},
    {"id": 164, "title": "Detect Cycle in a Linked List", "leetcode_slug": "detect-cycle-in-a-linked-list", "difficulty": "Easy", "topics": ["Linked List", "Two Pointers"], "companies": ["Microsoft", "Meta"], "frequency_score": 70, "premium": False, "url": "https://leetcode.com/problems/detect-cycle-in-a-linked-list/"},
    {"id": 165, "title": "Bitwise AND of Numbers Range", "leetcode_slug": "bitwise-and-of-numbers-range", "difficulty": "Medium", "topics": ["Bit Manipulation"], "companies": ["Amazon", "Google"], "frequency_score": 69, "premium": False, "url": "https://leetcode.com/problems/bitwise-and-of-numbers-range/"},
    {"id": 166, "title": "Single Number", "leetcode_slug": "single-number", "difficulty": "Easy", "topics": ["Bit Manipulation", "HashMap"], "companies": ["Microsoft", "Meta"], "frequency_score": 68, "premium": False, "url": "https://leetcode.com/problems/single-number/"},
    {"id": 167, "title": "Single Number II", "leetcode_slug": "single-number-ii", "difficulty": "Medium", "topics": ["Bit Manipulation"], "companies": ["Amazon", "Google"], "frequency_score": 67, "premium": False, "url": "https://leetcode.com/problems/single-number-ii/"},
    {"id": 168, "title": "Single Number III", "leetcode_slug": "single-number-iii", "difficulty": "Medium", "topics": ["Bit Manipulation"], "companies": ["Microsoft", "Meta"], "frequency_score": 66, "premium": False, "url": "https://leetcode.com/problems/single-number-iii/"}
]

if len(data) < 200:
    data.extend(extra)
    with path.open('w', encoding='utf-8') as handle:
        json.dump(data, handle, indent=2)

print(f'Total records: {len(data)}')
