"""
app/resume/repository.py
────────────────────────
Async SQLAlchemy repository for the Resume Analysis module.

Provides a clean CRUD abstraction layer on top of the ORM models.
All methods are no-ops (return None) if no DB session is injected,
enabling the app to run in stateless mode without PostgreSQL.
"""

from __future__ import annotations

import uuid
import logging
from datetime import datetime
from typing import List, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from sqlalchemy.ext.asyncio import AsyncSession

from app.resume.models import ResumeUpload, ResumeAnalysis
from app.resume.schemas import ResumeAnalysisReport, ParsedResume

logger = logging.getLogger("resume.repository")


# ─── Database Session Factory ─────────────────────────────────────────────────
# Created lazily so the app starts fine without DATABASE_URL.

_async_session_factory = None


def get_session_factory():
    """
    Returns the SQLAlchemy async session factory.
    Initialises it on first call if DATABASE_URL is configured.
    Returns None if no database is configured.
    """
    global _async_session_factory
    if _async_session_factory is not None:
        return _async_session_factory

    import os
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        return None

    try:
        from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
        from app.resume.models import Base

        engine = create_async_engine(
            db_url,
            echo=False,
            pool_size=10,
            max_overflow=20,
            pool_pre_ping=True,
        )
        _async_session_factory = async_sessionmaker(
            engine, expire_on_commit=False
        )
        logger.info("Async database engine initialised for Resume module.")
        return _async_session_factory

    except Exception as exc:
        logger.warning(f"Could not initialise DB engine: {exc}. Running in stateless mode.")
        return None


async def init_db() -> None:
    """
    Creates all tables if they don't exist.
    Called on application startup (optional — use Alembic for production migrations).
    """
    import os
    db_url = os.getenv("DATABASE_URL", "")
    if not db_url:
        logger.info("DATABASE_URL not set — skipping table creation.")
        return

    try:
        from sqlalchemy.ext.asyncio import create_async_engine
        from app.resume.models import Base

        engine = create_async_engine(db_url, echo=False)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Resume module database tables verified/created.")
    except Exception as exc:
        logger.warning(f"DB init skipped: {exc}")


# ─── Repository Methods ───────────────────────────────────────────────────────

class ResumeRepository:
    """
    Encapsulates all database operations for the Resume module.
    Accepts an injected AsyncSession; if None, all writes are skipped silently.
    """

    def __init__(self, session: Optional["AsyncSession"] = None):
        self._session = session

    # ── Uploads ──────────────────────────────────────────────────────

    async def save_upload(
        self,
        *,
        filename: str,
        target_domain: str,
        file_size_bytes: Optional[int] = None,
        page_count: int = 1,
        word_count: int = 0,
        user_id: Optional[str] = None,
    ) -> Optional[ResumeUpload]:
        """Persist upload metadata. Returns None if DB is not available."""
        if self._session is None:
            return None
        try:
            upload = ResumeUpload(
                id=uuid.uuid4(),
                user_id=user_id,
                filename=filename,
                file_size_bytes=file_size_bytes,
                target_domain=target_domain,
                page_count=page_count,
                word_count=word_count,
            )
            self._session.add(upload)
            await self._session.flush()
            logger.debug(f"Saved ResumeUpload: {upload.id}")
            return upload
        except Exception as exc:
            logger.error(f"Failed to save upload: {exc}")
            await self._session.rollback()
            return None

    # ── Analyses ─────────────────────────────────────────────────────

    async def save_analysis(
        self,
        *,
        upload_id: uuid.UUID,
        report: ResumeAnalysisReport,
        semantic_match_score: float = 0.0,
        duration_ms: Optional[int] = None,
    ) -> Optional[ResumeAnalysis]:
        """Persist full analysis report. Returns None if DB is not available."""
        if self._session is None:
            return None
        try:
            analysis = ResumeAnalysis(
                id=uuid.uuid4(),
                upload_id=upload_id,
                ats_score=report.ats_score,
                domain_match_pct=report.domain_match_pct,
                placement_readiness_score=report.placement_readiness_score,
                semantic_match_score=semantic_match_score,
                parsed_resume=report.parsed.model_dump(),
                keyword_analysis=report.keyword_analysis.model_dump(),
                ats_breakdown=report.ats_breakdown.model_dump(),
                project_relevance=[p.model_dump() for p in report.project_relevance],
                gemini_insights=report.gemini_insights.model_dump(),
                missing_skills=report.missing_skills,
                weak_sections=report.weak_sections,
                formatting_suggestions=report.formatting_suggestions,
                gemini_called=bool(report.gemini_insights.ai_summary),
                analysis_duration_ms=duration_ms,
            )
            self._session.add(analysis)
            await self._session.commit()
            await self._session.refresh(analysis)
            logger.info(f"Saved ResumeAnalysis: {analysis.id}")
            return analysis
        except Exception as exc:
            logger.error(f"Failed to save analysis: {exc}")
            await self._session.rollback()
            return None

    # ── Queries ───────────────────────────────────────────────────────

    async def get_analysis_by_id(
        self, analysis_id: str
    ) -> Optional[ResumeAnalysis]:
        """Fetch a single analysis by UUID string."""
        if self._session is None:
            return None
        try:
            from sqlalchemy import select
            stmt = select(ResumeAnalysis).where(
                ResumeAnalysis.id == uuid.UUID(analysis_id)
            )
            result = await self._session.execute(stmt)
            return result.scalar_one_or_none()
        except Exception as exc:
            logger.error(f"Failed to fetch analysis {analysis_id}: {exc}")
            return None

    async def get_user_history(
        self, user_id: str, limit: int = 10
    ) -> List[ResumeAnalysis]:
        """Fetch recent analyses for a user, joined with upload metadata."""
        if self._session is None:
            return []
        try:
            from sqlalchemy import select
            stmt = (
                select(ResumeAnalysis)
                .join(ResumeUpload, ResumeAnalysis.upload_id == ResumeUpload.id)
                .where(ResumeUpload.user_id == user_id)
                .order_by(ResumeAnalysis.created_at.desc())
                .limit(limit)
            )
            result = await self._session.execute(stmt)
            return list(result.scalars().all())
        except Exception as exc:
            logger.error(f"Failed to fetch history for user {user_id}: {exc}")
            return []
