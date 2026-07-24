"""
app/todo/analytics_repository.py

Pure data-access layer for analytics. All SQL lives here.
No business-rule math (rates, percentages, rounding) happens in this
file — that belongs in analytics_service.py.

Built against the real `app/todo/models.py` Todo model:
    id:            str (UUID)
    completed:     bool
    completed_at:  datetime | None   (set when a task is marked completed)
    category:      str, default "General"
    priority:      str, default "Medium"
    due_date:      date | None
    is_deleted:    bool              (soft delete flag)
    created_at:    datetime

Every query below filters `Todo.is_deleted == False`, matching the
existing TodoRepository.get_all_tasks() convention, so soft-deleted
tasks never leak into the dashboard numbers.
"""

from __future__ import annotations

from datetime import date, timedelta

from sqlalchemy import Date, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.todo.models import Todo


class AnalyticsRepository:
    """Read-only aggregate queries against the existing Todo table."""

    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    # ------------------------------------------------------------------
    # Summary counts
    # ------------------------------------------------------------------

    async def get_task_counts(self, today: date | None = None) -> dict[str, int]:
        """
        Single round-trip aggregate for total / completed / pending / overdue.
        Excludes soft-deleted tasks.
        """
        today = today or date.today()

        completed_expr = func.sum(case((Todo.completed.is_(True), 1), else_=0))
        pending_expr = func.sum(case((Todo.completed.is_(False), 1), else_=0))
        overdue_expr = func.sum(
            case(
                (
                    (Todo.completed.is_(False))
                    & (Todo.due_date.isnot(None))
                    & (Todo.due_date < today),
                    1,
                ),
                else_=0,
            )
        )

        stmt = select(
            func.count(Todo.id).label("total"),
            completed_expr.label("completed"),
            pending_expr.label("pending"),
            overdue_expr.label("overdue"),
        ).where(Todo.is_deleted.is_(False))

        result = await self.db.execute(stmt)
        row = result.one()

        return {
            "total_tasks": row.total or 0,
            "completed_tasks": row.completed or 0,
            "pending_tasks": row.pending or 0,
            "overdue_tasks": row.overdue or 0,
        }

    # ------------------------------------------------------------------
    # Weekly (last 7 days)
    # ------------------------------------------------------------------

    async def get_weekly_stats(self, today: date | None = None) -> list[dict]:
        """
        Returns per-day scheduled vs completed counts for the last 7 days
        (inclusive of today).

        - "scheduled" = tasks whose due_date falls on that day (not deleted).
        - "completed" = tasks actually completed on that day, using the
          real `completed_at` timestamp — not a guess based on due_date.
          This means a task due on Monday but finished on Wednesday counts
          toward Wednesday's "completed", which is the accurate reading.
        """
        today = today or date.today()
        start_date = today - timedelta(days=6)

        # Scheduled: grouped by due_date
        scheduled_col = Todo.due_date.label("day")
        scheduled_stmt = (
            select(scheduled_col, func.count(Todo.id).label("scheduled"))
            .where(Todo.is_deleted.is_(False))
            .where(Todo.due_date.isnot(None))
            .where(Todo.due_date >= start_date)
            .where(Todo.due_date <= today)
            .group_by(scheduled_col)
        )
        scheduled_rows = (await self.db.execute(scheduled_stmt)).all()
        scheduled_by_day = {row.day: row.scheduled for row in scheduled_rows}

        # Completed: grouped by the date part of completed_at
        completed_col = func.cast(Todo.completed_at, Date).label("day")
        completed_stmt = (
            select(completed_col, func.count(Todo.id).label("completed"))
            .where(Todo.is_deleted.is_(False))
            .where(Todo.completed.is_(True))
            .where(Todo.completed_at.isnot(None))
            .where(completed_col >= start_date)
            .where(completed_col <= today)
            .group_by(completed_col)
        )
        completed_rows = (await self.db.execute(completed_stmt)).all()
        completed_by_day = {row.day: row.completed for row in completed_rows}

        output: list[dict] = []
        for offset in range(7):
            day = start_date + timedelta(days=offset)
            output.append(
                {
                    "date": day,
                    "scheduled": scheduled_by_day.get(day, 0),
                    "completed": completed_by_day.get(day, 0),
                }
            )

        return output

    # ------------------------------------------------------------------
    # By category
    # ------------------------------------------------------------------

    async def get_category_counts(self) -> list[dict]:
        stmt = (
            select(
                Todo.category.label("category"),
                func.count(Todo.id).label("count"),
            )
            .where(Todo.is_deleted.is_(False))
            .group_by(Todo.category)
            .order_by(func.count(Todo.id).desc())
        )
        result = await self.db.execute(stmt)
        return [{"category": row.category, "count": row.count} for row in result.all()]

    # ------------------------------------------------------------------
    # By priority
    # ------------------------------------------------------------------

    async def get_priority_counts(self) -> list[dict]:
        stmt = (
            select(
                Todo.priority.label("priority"),
                func.count(Todo.id).label("count"),
            )
            .where(Todo.is_deleted.is_(False))
            .group_by(Todo.priority)
            .order_by(func.count(Todo.id).desc())
        )
        result = await self.db.execute(stmt)
        return [{"priority": row.priority, "count": row.count} for row in result.all()]
