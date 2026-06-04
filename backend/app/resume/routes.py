"""
app/resume/routes.py
────────────────────
FastAPI router for the Resume Analysis module.

Endpoints:
  POST /resume/analyze            Upload PDF + domain → full ResumeAnalysisReport
  GET  /resume/domains            List all supported target domains
  GET  /resume/analysis/{id}      Retrieve a specific analysis by UUID
  GET  /resume/history/{user_id}  Retrieve past analyses for a user
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    UploadFile,
    status,
)

from app.resume.config import SUPPORTED_DOMAINS, MAX_FILE_SIZE_MB, ALLOWED_MIME_TYPES
from app.resume.dependencies import get_resume_repo, get_gemini_client
from app.resume.repository import ResumeRepository
from app.resume.schemas import (
    AnalysisHistoryResponse,
    AnalysisHistoryItem,
    DomainListResponse,
    ResumeAnalysisReport,
)
from app.resume.service import ResumeAnalysisService

logger = logging.getLogger("resume.routes")

router = APIRouter()


# ─── GET /domains ──────────────────────────────────────────────────────────────

@router.get(
    "/domains",
    response_model=DomainListResponse,
    summary="List supported target domains",
)
async def list_supported_domains() -> DomainListResponse:
    return DomainListResponse(domains=SUPPORTED_DOMAINS, count=len(SUPPORTED_DOMAINS))


# ─── POST /analyze ─────────────────────────────────────────────────────────────

@router.post(
    "/analyze",
    response_model=ResumeAnalysisReport,
    status_code=status.HTTP_200_OK,
    summary="Analyse a resume PDF",
)
async def analyze_resume(
    file: UploadFile = File(..., description="PDF resume file (max 5 MB)"),
    target_domain: str = Form(...),
    user_id: Optional[str] = Form(None),
    repo: ResumeRepository = Depends(get_resume_repo),
) -> ResumeAnalysisReport:
    """
    Upload a PDF resume → run full analysis pipeline → return ResumeAnalysisReport.
    """
    logger.info(f"Analyze: file='{file.filename}', domain='{target_domain}'")

    # ── 1. Validate domain ────────────────────────────────────────────────────
    if target_domain not in SUPPORTED_DOMAINS:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported domain: '{target_domain}'. Valid: {', '.join(SUPPORTED_DOMAINS)}",
        )

    # ── 2. Read and validate file ─────────────────────────────────────────────
    try:
        file_bytes = await file.read()
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Failed to read uploaded file: {exc}",
        )

    if not file_bytes:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded file is empty.",
        )

    # Size check
    max_bytes = MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {MAX_FILE_SIZE_MB} MB size limit.",
        )

    # MIME / extension check (lenient — accept if extension is .pdf)
    content_type = file.content_type or ""
    filename = file.filename or "resume.pdf"
    if content_type not in ALLOWED_MIME_TYPES and not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Only PDF files are accepted. Received: '{content_type}'",
        )

    # ── 3. Get Gemini client (optional, degrades gracefully) ──────────────────
    gemini_model = None
    try:
        gemini_model = get_gemini_client()
    except HTTPException:
        logger.warning("Gemini unavailable — AI insights will use rule-based fallback.")

    # ── 4. Run analysis pipeline ───────────────────────────────────────────────
    service = ResumeAnalysisService(repository=repo, gemini_model=gemini_model)

    try:
        report = await service.analyze(
            file_bytes=file_bytes,
            filename=filename,
            target_domain=target_domain,
            user_id=user_id,
        )
        logger.info(
            f"Done: ATS={report.ats_score:.1f} "
            f"Domain={report.domain_match_pct:.1f}% "
            f"Ready={report.placement_readiness_score:.1f}"
        )
        return report

    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(exc))
    except Exception as exc:
        logger.error(f"Unexpected error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        )


# ─── GET /analysis/{analysis_id} ─────────────────────────────────────────────

@router.get("/analysis/{analysis_id}", summary="Retrieve analysis by ID")
async def get_analysis_by_id(
    analysis_id: str,
    repo: ResumeRepository = Depends(get_resume_repo),
):
    analysis = await repo.get_analysis_by_id(analysis_id)
    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis '{analysis_id}' not found. Persistence requires DATABASE_URL.",
        )
    return {
        "analysis_id": str(analysis.id),
        "ats_score": analysis.ats_score,
        "domain_match_pct": analysis.domain_match_pct,
        "placement_readiness_score": analysis.placement_readiness_score,
        "missing_skills": analysis.missing_skills,
        "weak_sections": analysis.weak_sections,
        "gemini_insights": analysis.gemini_insights,
        "created_at": analysis.created_at.isoformat(),
    }


# ─── GET /history/{user_id} ───────────────────────────────────────────────────

@router.get("/history/{user_id}", response_model=AnalysisHistoryResponse)
async def get_user_history(
    user_id: str,
    limit: int = Query(default=10, ge=1, le=50),
    repo: ResumeRepository = Depends(get_resume_repo),
) -> AnalysisHistoryResponse:
    analyses = await repo.get_user_history(user_id, limit=limit)
    items = []
    for a in analyses:
        upload = a.upload
        items.append(AnalysisHistoryItem(
            analysis_id=str(a.id),
            filename=upload.filename if upload else "unknown",
            target_domain=upload.target_domain if upload else "unknown",
            ats_score=a.ats_score,
            placement_readiness_score=a.placement_readiness_score,
            analyzed_at=a.created_at,
        ))
    return AnalysisHistoryResponse(user_id=user_id, items=items, total=len(items))
