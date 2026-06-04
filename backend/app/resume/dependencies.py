"""
app/resume/dependencies.py
──────────────────────────
FastAPI dependency injection providers for the Resume module.

Provides:
  - get_db_session()     : optional async DB session (None if no DB configured)
  - validate_pdf_file()  : validates upload MIME type and size
  - get_gemini_client()  : configured Gemini generative model instance
  - get_resume_repo()    : ResumeRepository bound to session
"""

from __future__ import annotations

import os
import logging
from typing import AsyncGenerator, Optional

from fastapi import Depends, HTTPException, UploadFile, status

from app.resume.config import MAX_FILE_SIZE_MB, ALLOWED_MIME_TYPES
from app.resume.repository import ResumeRepository, get_session_factory

logger = logging.getLogger("resume.dependencies")


# ─── Database Session ─────────────────────────────────────────────────────────

async def get_db_session() -> AsyncGenerator:
    """
    Yields an async SQLAlchemy session when DATABASE_URL is configured.
    Yields None silently when running in stateless mode.
    """
    factory = get_session_factory()
    if factory is None:
        yield None
        return

    async with factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise


# ─── Repository ───────────────────────────────────────────────────────────────

async def get_resume_repo(
    session=Depends(get_db_session),
) -> ResumeRepository:
    """Provides a ResumeRepository instance bound to the current DB session."""
    return ResumeRepository(session=session)


# ─── File Validation ──────────────────────────────────────────────────────────

async def validate_pdf_file(file: UploadFile) -> UploadFile:
    """
    Validates that the uploaded file:
      1. Has an accepted MIME type (application/pdf)
      2. Does not exceed MAX_FILE_SIZE_MB

    Raises HTTPException 422 on validation failure.
    """
    # Check content type header
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        # Tolerate missing content-type — check filename extension as fallback
        if not (file.filename or "").lower().endswith(".pdf"):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Only PDF files are accepted. Received: '{content_type or 'unknown'}'",
            )

    # Check file size by reading into memory with a size cap
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    content = await file.read(max_bytes + 1)
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {MAX_FILE_SIZE_MB} MB size limit.",
        )

    # Rewind the file so downstream consumers can read it again
    await file.seek(0)
    return file


# ─── Gemini Client ────────────────────────────────────────────────────────────

_gemini_model = None


def get_gemini_client():
    """
    Returns a configured Gemini GenerativeModel instance.
    Raises HTTPException 503 if GEMINI_API_KEY is not set.
    Lazily initialised and cached for performance.
    """
    global _gemini_model
    if _gemini_model is not None:
        return _gemini_model

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini API key not configured. Set GEMINI_API_KEY in .env",
        )

    try:
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        _gemini_model = genai.GenerativeModel("gemini-1.5-flash")
        logger.info("Gemini client initialised (gemini-1.5-flash).")
        return _gemini_model
    except Exception as exc:
        logger.error(f"Failed to initialise Gemini client: {exc}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not initialise Gemini client: {exc}",
        )
