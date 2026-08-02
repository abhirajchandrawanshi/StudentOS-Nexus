from __future__ import annotations

from typing import Any, Dict, Iterable, List, Set


_TOPIC_ALIASES = {
    "array": "arrays",
    "arrays": "arrays",
    "string": "strings",
    "strings": "strings",
    "tree": "trees",
    "trees": "trees",
    "graph": "graphs",
    "graphs": "graphs",
    "dp": "dp",
    "dynamic-programming": "dp",
    "dynamic programming": "dp",
}


def _normalize_topic_name(raw: str) -> str:
    key = (raw or "").strip().lower()
    return _TOPIC_ALIASES.get(key, key)


def _extract_solved_topics(profile_data: Dict[str, Any]) -> Set[str]:
    topics: Set[str] = set()
    tag_pools = profile_data.get("tagProblemCounts", {})

    for pool_name in ["fundamental", "intermediate", "advanced"]:
        for item in tag_pools.get(pool_name, []):
            if int(item.get("problemsSolved", 0)) <= 0:
                continue
            tag_slug = str(item.get("tagSlug", ""))
            normalized = _normalize_topic_name(tag_slug)
            if normalized:
                topics.add(normalized)

    return topics


def _question_topics(question: Dict[str, Any]) -> Set[str]:
    if "topic" in question and question.get("topic"):
        return {_normalize_topic_name(str(question["topic"]))}

    topics: Iterable[str] = question.get("topics", []) or []
    return {_normalize_topic_name(str(topic)) for topic in topics if str(topic).strip()}


def _question_slug(question: Dict[str, Any]) -> str:
    slug = str(question.get("titleSlug", "")).strip().lower()
    if slug:
        return slug

    url = str(question.get("url", "")).rstrip("/")
    if "/problems/" in url:
        return url.split("/problems/")[-1].strip("/").lower()

    title = str(question.get("title", "")).strip().lower()
    return title.replace(" ", "-")


def infer_solved_question_slugs(
    *,
    profile_data: Dict[str, Any],
    questions: List[Dict[str, Any]],
) -> List[str]:
    """
    Infer solved question slugs by mapping solved LeetCode topic tags
    to the local recommendation catalog topics.
    """
    solved_topics = _extract_solved_topics(profile_data)
    if not solved_topics:
        return []

    slugs: Set[str] = set()
    for question in questions:
        if solved_topics.intersection(_question_topics(question)):
            slug = _question_slug(question)
            if slug:
                slugs.add(slug)

    return sorted(slugs)
