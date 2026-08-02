from __future__ import annotations

from typing import Any, Dict, List


def _weekly_milestone(week: int, topic: str) -> str:
    return f"Week {week}: Build confidence in {topic} patterns and complete timed practice."


def generate_weekly_roadmap(
    *,
    weak_topics: List[str],
    company: str,
    domain: str,
    questions: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Generate a structured weekly roadmap from weak topics and recommended questions."""
    weeks_total = 6
    topics = weak_topics[:] if weak_topics else ["Arrays", "Trees", "Graphs"]

    weeks: List[Dict[str, Any]] = []
    questions_per_week = max(1, len(questions) // weeks_total)

    for i in range(weeks_total):
        week_num = i + 1
        start = i * questions_per_week
        end = len(questions) if week_num == weeks_total else (i + 1) * questions_per_week
        week_questions = questions[start:end]

        focus_topics = [topics[i % len(topics)]]
        if len(topics) > 1:
            focus_topics.append(topics[(i + 1) % len(topics)])

        hours = 6 + i

        weeks.append(
            {
                "week": week_num,
                "topics": focus_topics,
                "questions": week_questions,
                "hours": hours,
                "milestones": [
                    _weekly_milestone(week_num, focus_topics[0]),
                    f"Simulate one {company} style interview round.",
                ],
            }
        )

    return {
        "company": company,
        "domain": domain,
        "durationWeeks": weeks_total,
        "weeks": weeks,
    }
