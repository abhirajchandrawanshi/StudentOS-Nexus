"""
app/todo/analytics_models.py

No new persisted table is required for the current analytics scope
(summary / weekly / category / priority / progress) because every one
of those metrics can be derived directly from the existing `Todo`
table with aggregate SQL — including a proper "completed on day X"
reading, since the real model already has `completed_at`. Per the
"do not duplicate Todo data" rule, we deliberately do NOT create a
shadow table here.

We only import the existing model so the repository has a single,
shared reference to it.
"""

from app.todo.models import Todo  # noqa: F401  (re-exported for repository use)


# ---------------------------------------------------------------------------
# OPTIONAL: historical/audit table
# ---------------------------------------------------------------------------
# If you later need true historical tracking (e.g. "completion rate over the
# last 6 months" after old todos have been deleted, or day-by-day snapshots
# that don't rely on `completed_at`), uncomment and adapt this model. It is
# NOT wired into the repository/service by default, since the current
# endpoints can all be computed from live Todo rows.
#
# from datetime import date
# from sqlalchemy import Date, Integer
# from sqlalchemy.orm import Mapped, mapped_column
# from app.database import Base
#
# class TodoAnalyticsSnapshot(Base):
#     """Daily snapshot of task counts, captured by a scheduled job."""
#
#     __tablename__ = "todo_analytics_snapshots"
#
#     id: Mapped[int] = mapped_column(Integer, primary_key=True)
#     snapshot_date: Mapped[date] = mapped_column(Date, unique=True, index=True)
#     total_tasks: Mapped[int] = mapped_column(Integer, default=0)
#     completed_tasks: Mapped[int] = mapped_column(Integer, default=0)
#     pending_tasks: Mapped[int] = mapped_column(Integer, default=0)
#     overdue_tasks: Mapped[int] = mapped_column(Integer, default=0)
