"""
app/todo/analytics_routes.py

Isolated router for analytics endpoints. Mounted separately in main.py
so the existing todo router / CRUD paths are never touched.
"""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db  # adjust import path if your dependency lives elsewhere
from app.todo.analytics_repository import AnalyticsRepository
from app.todo.analytics_schemas import (
    AnalyticsSummaryResponse,
    CategoryAnalyticsItem,
    PriorityAnalyticsItem,
    ProgressAnalyticsResponse,
    WeeklyAnalyticsItem,
)
from app.todo.analytics_service import AnalyticsService

router = APIRouter(prefix="/todo/analytics", tags=["Todo Analytics"])


def get_analytics_service(db: AsyncSession = Depends(get_db)) -> AnalyticsService:
    repository = AnalyticsRepository(db)
    return AnalyticsService(repository)


@router.get("/summary", response_model=AnalyticsSummaryResponse)
async def get_summary(
    service: AnalyticsService = Depends(get_analytics_service),
) -> AnalyticsSummaryResponse:
    return await service.get_summary()


@router.get("/weekly", response_model=list[WeeklyAnalyticsItem])
async def get_weekly(
    service: AnalyticsService = Depends(get_analytics_service),
) -> list[WeeklyAnalyticsItem]:
    return await service.get_weekly()


@router.get("/category", response_model=list[CategoryAnalyticsItem])
async def get_category(
    service: AnalyticsService = Depends(get_analytics_service),
) -> list[CategoryAnalyticsItem]:
    return await service.get_category_breakdown()


@router.get("/priority", response_model=list[PriorityAnalyticsItem])
async def get_priority(
    service: AnalyticsService = Depends(get_analytics_service),
) -> list[PriorityAnalyticsItem]:
    return await service.get_priority_breakdown()


@router.get("/progress", response_model=ProgressAnalyticsResponse)
async def get_progress(
    service: AnalyticsService = Depends(get_analytics_service),
) -> ProgressAnalyticsResponse:
    return await service.get_progress()
