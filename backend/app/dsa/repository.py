from __future__ import annotations

import logging
import os
import uuid
from dataclasses import dataclass
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

from app.dsa.models_db import Base, CompanyReadiness, QuestionHistory, RoadmapProgress

logger = logging.getLogger("dsa.repository")

_async_session_factory = None


class DSARepositoryError(RuntimeError):
    """Raised when a DB-backed repository operation fails."""


class DSAStatelessModeError(RuntimeError):
    """Raised when a write operation is requested without an active DB session."""


@dataclass(frozen=True)
class PersistenceResult:
    persisted: bool
    record_id: Optional[str] = None


def get_session_factory():
    global _async_session_factory
    if _async_session_factory is not None:
        return _async_session_factory

    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        return None

    try:
        from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

        engine = create_async_engine(
            db_url,
            echo=False,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
        )
        _async_session_factory = async_sessionmaker(engine, expire_on_commit=False)
        logger.info("DSA database engine initialized.")
        return _async_session_factory
    except Exception as exc:
        logger.warning("DSA DB engine init failed: %s", exc)
        return None


async def init_db() -> None:
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        logger.info("DATABASE_URL not set for DSA; running in stateless mode.")
        return

    try:
        from sqlalchemy.ext.asyncio import create_async_engine

        engine = create_async_engine(db_url, echo=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("DSA tables verified/created.")
    except Exception as exc:
        logger.warning("DSA DB init skipped: %s", exc)


class DSARepository:
    def __init__(self, session: Optional["AsyncSession"] = None):
        self._session = session

    async def save_question_completion(
        self,
        *,
        username: str,
        question_id: int,
        status: str,
        topic: Optional[str] = None,
        difficulty: Optional[str] = None,
        company: Optional[str] = None,
    ) -> PersistenceResult:
        if self._session is None:
            raise DSAStatelessModeError("DATABASE_URL is not configured; no DB session available")

        try:
            row = QuestionHistory(
                id=uuid.uuid4(),
                username=username,
                question_id=question_id,
                status=status,
                topic=topic,
                difficulty=difficulty,
                company=company,
            )
            self._session.add(row)
            await self._session.commit()
            await self._session.refresh(row)
            return PersistenceResult(persisted=True, record_id=str(row.id))
        except Exception as exc:
            logger.error("Failed to save question completion: %s", exc)
            await self._session.rollback()
            raise DSARepositoryError("Failed to save question completion") from exc

    async def get_question_history(self, *, username: str, limit: int = 50) -> List[QuestionHistory]:
        if self._session is None:
            return []

        try:
            from sqlalchemy import select

            stmt = (
                select(QuestionHistory)
                .where(QuestionHistory.username == username)
                .order_by(QuestionHistory.created_at.desc())
                .limit(limit)
            )
            result = await self._session.execute(stmt)
            return list(result.scalars().all())
        except Exception as exc:
            logger.error("Failed to fetch question history: %s", exc)
            return []

    async def save_roadmap_progress(self, *, username: str, roadmap_id: str, roadmap_payload: dict) -> PersistenceResult:
        if self._session is None:
            raise DSAStatelessModeError("DATABASE_URL is not configured; no DB session available")

        try:
            row = RoadmapProgress(
                id=uuid.uuid4(),
                username=username,
                roadmap_id=roadmap_id,
                roadmap_payload=roadmap_payload,
            )
            self._session.add(row)
            await self._session.commit()
            await self._session.refresh(row)
            return PersistenceResult(persisted=True, record_id=str(row.id))
        except Exception as exc:
            logger.error("Failed to save roadmap progress: %s", exc)
            await self._session.rollback()
            raise DSARepositoryError("Failed to save roadmap progress") from exc

    async def get_latest_roadmap(self, *, username: str) -> Optional[RoadmapProgress]:
        if self._session is None:
            return None

        try:
            from sqlalchemy import select

            stmt = (
                select(RoadmapProgress)
                .where(RoadmapProgress.username == username)
                .order_by(RoadmapProgress.created_at.desc())
                .limit(1)
            )
            result = await self._session.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as exc:
            logger.error("Failed to fetch latest roadmap: %s", exc)
            return None

    async def save_company_readiness(
        self,
        *,
        username: str,
        company: str,
        domain: str,
        readiness_score: float,
        explanation: str,
        factors: dict,
    ) -> PersistenceResult:
        if self._session is None:
            raise DSAStatelessModeError("DATABASE_URL is not configured; no DB session available")

        try:
            row = CompanyReadiness(
                id=uuid.uuid4(),
                username=username,
                company=company,
                domain=domain,
                readiness_score=readiness_score,
                explanation=explanation,
                factors=factors,
            )
            self._session.add(row)
            await self._session.commit()
            await self._session.refresh(row)
            return PersistenceResult(persisted=True, record_id=str(row.id))
        except Exception as exc:
            logger.error("Failed to save company readiness: %s", exc)
            await self._session.rollback()
            raise DSARepositoryError("Failed to save company readiness") from exc
