"""
app/todo/analytics_service.py

Business logic only. All SQL stays in analytics_repository.py.
"""

from __future__ import annotations

from datetime import date

from app.todo.analytics_repository import AnalyticsRepository
from app.todo.analytics_schemas import (
    AnalyticsSummaryResponse,
    CategoryAnalyticsItem,
    PriorityAnalyticsItem,
    ProgressAnalyticsResponse,
    WeeklyAnalyticsItem,
)

_WEEKDAY_LABELS = ("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")


def _completion_rate(completed: int, total: int) -> float:
    if total == 0:
        return 0.0
    return round((completed / total) * 100, 2)


def _consistency_score(completed: int, total: int) -> int:
    """
    Placeholder scoring model (per current spec):
        consistency_score = completed_tasks / total_tasks * 100, rounded.

    Kept as its own function so the formula can be swapped later
    (e.g. streaks, on-time completion weighting) without touching
    callers.
    """
    if total == 0:
        return 0
    return round((completed / total) * 100)


class AnalyticsService:
    def __init__(self, repository: AnalyticsRepository) -> None:
        self.repository = repository

    # ------------------------------------------------------------------

    async def get_summary(self) -> AnalyticsSummaryResponse:
        counts = await self.repository.get_task_counts()
        total = counts["total_tasks"]
        completed = counts["completed_tasks"]

        return AnalyticsSummaryResponse(
            total_tasks=total,
            completed_tasks=completed,
            pending_tasks=counts["pending_tasks"],
            overdue_tasks=counts["overdue_tasks"],
            completion_rate=_completion_rate(completed, total),
            consistency_score=_consistency_score(completed, total),
        )

    # ------------------------------------------------------------------

    async def get_weekly(self) -> list[WeeklyAnalyticsItem]:
        raw = await self.repository.get_weekly_stats()

        items: list[WeeklyAnalyticsItem] = []
        for entry in raw:
            day: date = entry["date"]
            scheduled = entry["scheduled"]
            completed = entry["completed"]
            completion_pct = (
                round((completed / scheduled) * 100) if scheduled else 0
            )
            items.append(
                WeeklyAnalyticsItem(
                    day=_WEEKDAY_LABELS[day.weekday()],
                    scheduled=scheduled,
                    completed=completed,
                    completion=completion_pct,
                )
            )

        return items

    # ------------------------------------------------------------------

    async def get_category_breakdown(self) -> list[CategoryAnalyticsItem]:
        rows = await self.repository.get_category_counts()
        return [CategoryAnalyticsItem(**row) for row in rows]

    # ------------------------------------------------------------------

    async def get_priority_breakdown(self) -> list[PriorityAnalyticsItem]:
        rows = await self.repository.get_priority_counts()
        return [PriorityAnalyticsItem(**row) for row in rows]

    # ------------------------------------------------------------------

    async def get_progress(self) -> ProgressAnalyticsResponse:
        counts = await self.repository.get_task_counts()
        total = counts["total_tasks"]
        completed = counts["completed_tasks"]

        weekly = await self.get_weekly()

        return ProgressAnalyticsResponse(
            total_tasks=total,
            completed_tasks=completed,
            pending_tasks=counts["pending_tasks"],
            completion_rate=_completion_rate(completed, total),
            weekly_trend=weekly,
        )
