from __future__ import annotations

from typing import Any, Dict, List, Sequence

from app.dsa.question_dataset import load_questions


def _to_slug(url: str, title: str) -> str:
    cleaned = (url or "").rstrip("/")
    if "/problems/" in cleaned:
        return cleaned.split("/problems/")[-1].strip("/").lower()
    return title.strip().lower().replace(" ", "-")


def _normalize_topic(topics: Sequence[str]) -> str:
    mapping = {
        "array": "Arrays",
        "arrays": "Arrays",
        "string": "Strings",
        "strings": "Strings",
        "tree": "Trees",
        "trees": "Trees",
        "graph": "Graphs",
        "graphs": "Graphs",
        "dp": "DP",
        "dynamic programming": "DP",
    }
    for item in topics:
        key = item.strip().lower()
        if key in mapping:
            return mapping[key]
    return topics[0] if topics else "Arrays"


def _normalize_question(question: Dict[str, Any]) -> Dict[str, Any]:
    topics = question.get("topics", [])
    primary_topic = _normalize_topic(topics)
    slug = _to_slug(question.get("url", ""), question.get("title", ""))

    return {
        "id": int(question.get("id", 0)),
        "title": str(question.get("title", "")),
        "titleSlug": slug,
        "difficulty": str(question.get("difficulty", "Medium")),
        "topic": primary_topic,
        "companyTags": list(question.get("companies", [])),
        "url": str(question.get("url", "")),
        "masteryStatus": "unsolved",
    }


def _pick_by_difficulty(
    ranked: List[Dict[str, Any]],
    diff: str,
    limit: int,
    used_ids: set[int],
) -> List[Dict[str, Any]]:
    selected: List[Dict[str, Any]] = []
    for q in ranked:
        if len(selected) >= limit:
            break
        if q["difficulty"].lower() != diff.lower():
            continue
        if q["id"] in used_ids:
            continue
        used_ids.add(q["id"])
        selected.append(q)
    return selected


def generate_recommended_questions(
    *,
    weak_topics: List[str],
    solved_questions: List[str],
    company: str,
    total: int = 20,
) -> List[Dict[str, Any]]:
    """
    Generate 20 questions with 40% Easy, 40% Medium, 20% Hard.
    Rules: avoid solved questions and prioritize weak topics.
    """
    weak_set = {topic.strip().lower() for topic in weak_topics}
    solved_set = {slug.strip().lower() for slug in solved_questions}
    company_lc = (company or "").strip().lower()

    normalized = [_normalize_question(item) for item in load_questions()]

    unsolved = [q for q in normalized if q["titleSlug"].lower() not in solved_set]
    if not unsolved:
        unsolved = normalized

    def rank_score(q: Dict[str, Any]) -> tuple[int, int, int]:
        weak_match = 1 if q["topic"].strip().lower() in weak_set else 0
        company_match = 1 if any(c.strip().lower() == company_lc for c in q.get("companyTags", [])) else 0
        # Prefer lower id for deterministic output on tie.
        return (weak_match, company_match, -q["id"])

    ranked = sorted(unsolved, key=rank_score, reverse=True)

    easy_target = int(total * 0.4)
    medium_target = int(total * 0.4)
    hard_target = total - easy_target - medium_target

    used_ids: set[int] = set()
    selected: List[Dict[str, Any]] = []

    selected.extend(_pick_by_difficulty(ranked, "Easy", easy_target, used_ids))
    selected.extend(_pick_by_difficulty(ranked, "Medium", medium_target, used_ids))
    selected.extend(_pick_by_difficulty(ranked, "Hard", hard_target, used_ids))

    if len(selected) < total:
        for q in ranked:
            if len(selected) >= total:
                break
            if q["id"] in used_ids:
                continue
            used_ids.add(q["id"])
            selected.append(q)

    return selected[:total]
