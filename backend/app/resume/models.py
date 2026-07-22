"""
app/resume/models.py
────────────────────
SQLAlchemy 2.0 ORM models for the Resume Analysis module.

Tables:
  - resume_uploads   : file metadata per upload
  - resume_analyses  : full analysis JSON result, FK → resume_uploads

The models are only imported/used when DATABASE_URL is set.
If no DB is configured, the app runs in stateless/in-memory mode.
"""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    String, Float, Integer, Text, DateTime, Boolean,
    ForeignKey, func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


# ─── Base Class ───────────────────────────────────────────────────────────────

class Base(DeclarativeBase):
    pass


# ─── resume_uploads ───────────────────────────────────────────────────────────

class ResumeUpload(Base):
    """
    Stores metadata for every uploaded resume file.
    One upload can have one analysis result (one-to-one via back_populates).
    """

    __tablename__ = "resume_uploads"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[Optional[str]] = mapped_column(
        String(255), nullable=True, index=True,
        comment="Optional user identifier (null = anonymous)",
    )
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_size_bytes: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    target_domain: Mapped[str] = mapped_column(String(100), nullable=False)
    page_count: Mapped[int] = mapped_column(Integer, default=1)
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationship
    analysis: Mapped[Optional["ResumeAnalysis"]] = relationship(
        "ResumeAnalysis", back_populates="upload", uselist=False, cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<ResumeUpload id={self.id} filename={self.filename!r} domain={self.target_domain!r}>"


# ─── resume_analyses ──────────────────────────────────────────────────────────

class ResumeAnalysis(Base):
    """
    Stores the full analysis result for a single resume upload.
    Uses JSONB columns for flexible sub-score storage.
    """

    __tablename__ = "resume_analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    upload_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("resume_uploads.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True,
    )

    # ── Primary scores ──────────────────────────────────────────────
    ats_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    domain_match_pct: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    placement_readiness_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    semantic_match_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    # ── JSONB payloads ──────────────────────────────────────────────
    parsed_resume: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, comment="Full ParsedResume dict"
    )
    keyword_analysis: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, comment="KeywordAnalysis dict"
    )
    ats_breakdown: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, comment="ATSBreakdown dict"
    )
    project_relevance: Mapped[Optional[list]] = mapped_column(
        JSONB, nullable=True, comment="List[ProjectRelevance] dicts"
    )
    gemini_insights: Mapped[Optional[dict]] = mapped_column(
        JSONB, nullable=True, comment="GeminiInsights dict"
    )

    # ── Flat actionable lists (for quick querying) ───────────────────
    missing_skills: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    weak_sections: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)
    formatting_suggestions: Mapped[Optional[list]] = mapped_column(JSONB, nullable=True)

    # ── Meta ────────────────────────────────────────────────────────
    gemini_called: Mapped[bool] = mapped_column(Boolean, default=False)
    analysis_duration_ms: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, comment="Total pipeline duration in milliseconds"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationship
    upload: Mapped["ResumeUpload"] = relationship("ResumeUpload", back_populates="analysis")

    def __repr__(self) -> str:
        return (
            f"<ResumeAnalysis id={self.id} "
            f"ats={self.ats_score:.1f} "
            f"readiness={self.placement_readiness_score:.1f}>"
        )
