"""
app/todo/analytics_schemas.py

Pydantic schemas for the Todo Analytics module.
Kept fully separate from the existing todo/schemas.py so CRUD schemas
are never touched.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# /todo/analytics/summary
# ---------------------------------------------------------------------------

class AnalyticsSummaryResponse(BaseModel):
    total_tasks: int = Field(..., ge=0)
    completed_tasks: int = Field(..., ge=0)
    pending_tasks: int = Field(..., ge=0)
    overdue_tasks: int = Field(..., ge=0)
    completion_rate: float = Field(..., ge=0, le=100)
    consistency_score: int = Field(..., ge=0, le=100)

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_tasks": 20,
                "completed_tasks": 14,
                "pending_tasks": 6,
                "overdue_tasks": 2,
                "completion_rate": 70.0,
                "consistency_score": 70,
            }
        }
    }


# ---------------------------------------------------------------------------
# /todo/analytics/weekly
# ---------------------------------------------------------------------------

class WeeklyAnalyticsItem(BaseModel):
    day: str  # e.g. "Mon"
    scheduled: int = Field(..., ge=0)
    completed: int = Field(..., ge=0)
    completion: int = Field(..., ge=0, le=100)


# Endpoint returns a bare JSON array (list[WeeklyAnalyticsItem]) per spec,
# so no wrapper response model is used in the route.



# ---------------------------------------------------------------------------
# /todo/analytics/category
# ---------------------------------------------------------------------------

class CategoryAnalyticsItem(BaseModel):
    category: str
    count: int = Field(..., ge=0)


# Endpoint returns a bare JSON array (list[CategoryAnalyticsItem]) per spec.


# ---------------------------------------------------------------------------
# /todo/analytics/priority
# ---------------------------------------------------------------------------

class PriorityAnalyticsItem(BaseModel):
    priority: str
    count: int = Field(..., ge=0)


# Endpoint returns a bare JSON array (list[PriorityAnalyticsItem]) per spec.


# ---------------------------------------------------------------------------
# /todo/analytics/progress
# ---------------------------------------------------------------------------

class ProgressAnalyticsResponse(BaseModel):
    total_tasks: int = Field(..., ge=0)
    completed_tasks: int = Field(..., ge=0)
    pending_tasks: int = Field(..., ge=0)
    completion_rate: float = Field(..., ge=0, le=100)
    weekly_trend: list[WeeklyAnalyticsItem]
