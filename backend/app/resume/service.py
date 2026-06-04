"""
app/resume/service.py
─────────────────────
Resume Analysis Service — orchestrates all pipeline stages.

Pipeline order:
  1. pdf_parser       → RawResumeText
  2. section_extractor → ParsedResume
  3. skill_analyzer   → SkillAnalysisResult
  4. ats_scorer       → ATSScoringResult
  5. semantic_scorer  → SemanticScoringResult
  6. gemini_analyzer  → GeminiInsights
  7. score_composer   → ResumeAnalysisReport (final composite score)
  8. repository.save  → optional DB persistence

Each stage is independently fault-tolerant — an exception in one stage
degrades gracefully rather than failing the entire request.
"""

from __future__ import annotations

import logging
import time
import uuid
from typing import Optional

from app.resume.config import SCORING_WEIGHTS, SUPPORTED_DOMAINS
from app.resume.schemas import (
    ParsedResume,
    ResumeAnalysisReport,
    SkillAnalysisResult,
    ATSScoringResult,
    SemanticScoringResult,
    GeminiInsights,
    KeywordAnalysis,
    ATSBreakdown,
)
from app.resume.pipelines.pdf_parser import extract_pdf_text
from app.resume.pipelines.section_extractor import parse_resume_sections
from app.resume.pipelines.skill_analyzer import analyze_skills
from app.resume.pipelines.ats_scorer import score_ats
from app.resume.pipelines.semantic_scorer import score_semantic
from app.resume.pipelines.gemini_analyzer import analyze_with_gemini
from app.resume.repository import ResumeRepository
from app.resume.utils.text_utils import clamp

logger = logging.getLogger("resume.service")


class ResumeAnalysisService:
    """
    Stateless service class that orchestrates the full resume analysis pipeline.
    Instantiate per-request (lightweight — no heavy state).
    """

    def __init__(
        self,
        repository: ResumeRepository,
        gemini_model=None,
    ):
        self._repo = repository
        self._gemini = gemini_model

    async def analyze(
        self,
        file_bytes: bytes,
        filename: str,
        target_domain: str,
        user_id: Optional[str] = None,
    ) -> ResumeAnalysisReport:
        """
        Full analysis pipeline entry point.

        Args:
            file_bytes:    Raw PDF bytes from the upload
            filename:      Original filename (for storage metadata)
            target_domain: Selected job domain (must be in SUPPORTED_DOMAINS)
            user_id:       Optional user identifier for history tracking

        Returns:
            ResumeAnalysisReport — complete analysis result
        """
        start_ms = int(time.time() * 1000)
        logger.info(f"Starting resume analysis: '{filename}' → '{target_domain}'")

        # Validate domain
        if target_domain not in SUPPORTED_DOMAINS:
            logger.warning(f"Unsupported domain '{target_domain}' — defaulting to 'Backend Developer'")
            target_domain = "Backend Developer"

        # ── Stage 1: PDF Extraction ──────────────────────────────────────────
        raw = await self._run_stage(
            "pdf_parser",
            extract_pdf_text(file_bytes, filename),
        )
        if raw is None or not raw.full_text.strip():
            raise ValueError(
                "Could not extract text from the uploaded PDF. "
                "Please ensure the file is a valid, text-based PDF (not a scanned image)."
            )

        # ── Stage 2: Section Extraction ──────────────────────────────────────
        parsed: ParsedResume = await self._run_stage(
            "section_extractor",
            self._sync_stage(parse_resume_sections, raw),
        ) or _empty_parsed(raw.full_text, raw.page_count)

        # ── Stage 3: Skill Analysis ───────────────────────────────────────────
        skill_result: SkillAnalysisResult = await self._run_stage(
            "skill_analyzer",
            self._sync_stage(analyze_skills, parsed, target_domain),
        ) or _empty_skill_result()

        # ── Stage 4: ATS Scoring ──────────────────────────────────────────────
        ats_result: ATSScoringResult = await self._run_stage(
            "ats_scorer",
            self._sync_stage(score_ats, parsed, skill_result),
        ) or _empty_ats_result()

        # ── Stage 5: Semantic Scoring ─────────────────────────────────────────
        semantic_result: SemanticScoringResult = await self._run_stage(
            "semantic_scorer",
            self._sync_stage(score_semantic, parsed, target_domain),
        ) or _empty_semantic_result(parsed)

        # ── Stage 6: Gemini AI Analysis ───────────────────────────────────────
        gemini_insights: GeminiInsights = await self._run_stage(
            "gemini_analyzer",
            analyze_with_gemini(
                self._gemini, parsed, target_domain,
                skill_result, ats_result, semantic_result,
            ),
        ) or _empty_gemini_insights(ats_result, skill_result)

        # ── Stage 7: Composite Score Calculation ─────────────────────────────
        placement_readiness = _compute_placement_readiness(
            ats_score=ats_result.ats_score,
            domain_match_pct=skill_result.domain_match_pct,
            semantic_match_score=semantic_result.semantic_match_score,
            project_relevance_avg=semantic_result.project_relevance_avg,
            gemini_holistic_score=gemini_insights.gemini_holistic_score,
        )

        duration_ms = int(time.time() * 1000) - start_ms
        logger.info(
            f"Analysis complete in {duration_ms}ms: "
            f"ATS={ats_result.ats_score:.1f} "
            f"Domain={skill_result.domain_match_pct:.1f}% "
            f"Readiness={placement_readiness:.1f}"
        )

        # ── Stage 8: Build Report ─────────────────────────────────────────────
        report = ResumeAnalysisReport(
            analysis_id=None,  # will be updated after DB save
            target_domain=target_domain,
            filename=filename,
            ats_score=round(ats_result.ats_score, 2),
            domain_match_pct=round(skill_result.domain_match_pct, 2),
            placement_readiness_score=round(placement_readiness, 2),
            missing_skills=skill_result.missing_skills,
            weak_sections=ats_result.weak_sections,
            formatting_suggestions=ats_result.formatting_suggestions,
            keyword_analysis=skill_result.keyword_analysis,
            project_relevance=semantic_result.project_relevance,
            ats_breakdown=ats_result.breakdown,
            gemini_insights=gemini_insights,
            parsed=parsed,
        )

        # ── Stage 9: Persist to DB (optional) ────────────────────────────────
        analysis_id = await self._persist(
            report=report,
            filename=filename,
            target_domain=target_domain,
            parsed=parsed,
            semantic_match_score=semantic_result.semantic_match_score,
            user_id=user_id,
            duration_ms=duration_ms,
        )
        if analysis_id:
            report.analysis_id = analysis_id

        return report

    # ─── Internal Helpers ────────────────────────────────────────────────────

    async def _run_stage(self, stage_name: str, coro):
        """Execute a pipeline stage, logging and swallowing exceptions."""
        try:
            import inspect
            if inspect.isawaitable(coro):
                return await coro
            return coro
        except Exception as exc:
            logger.error(f"Pipeline stage '{stage_name}' failed: {exc}", exc_info=True)
            return None

    async def _sync_stage(self, fn, *args):
        """Wrap a synchronous function as an awaitable."""
        import asyncio
        return await asyncio.to_thread(fn, *args)

    async def _persist(
        self,
        report: ResumeAnalysisReport,
        filename: str,
        target_domain: str,
        parsed: ParsedResume,
        semantic_match_score: float,
        user_id: Optional[str],
        duration_ms: int,
    ) -> Optional[str]:
        """Attempt to persist upload + analysis to DB. Returns analysis_id or None."""
        try:
            upload = await self._repo.save_upload(
                filename=filename,
                target_domain=target_domain,
                page_count=parsed.page_count,
                word_count=parsed.word_count,
                user_id=user_id,
            )
            if upload is None:
                return None  # DB not configured

            analysis = await self._repo.save_analysis(
                upload_id=upload.id,
                report=report,
                semantic_match_score=semantic_match_score,
                duration_ms=duration_ms,
            )
            return str(analysis.id) if analysis else None
        except Exception as exc:
            logger.warning(f"DB persistence failed (non-fatal): {exc}")
            return None


# ─── Composite Score Calculator ───────────────────────────────────────────────

def _compute_placement_readiness(
    ats_score: float,
    domain_match_pct: float,
    semantic_match_score: float,
    project_relevance_avg: float,
    gemini_holistic_score: float,
) -> float:
    """
    Weighted composite score formula (see implementation_plan.md):

      readiness = 0.30 × ats_score
               + 0.25 × domain_match_pct
               + 0.20 × semantic_match_score × 100
               + 0.15 × project_relevance_avg × 100
               + 0.10 × gemini_holistic_score
    """
    score = (
        SCORING_WEIGHTS["ats_score"]            * ats_score
        + SCORING_WEIGHTS["domain_match_pct"]   * domain_match_pct
        + SCORING_WEIGHTS["semantic_match_score"]* semantic_match_score * 100
        + SCORING_WEIGHTS["project_relevance_avg"] * project_relevance_avg * 100
        + SCORING_WEIGHTS["gemini_holistic_score"] * gemini_holistic_score
    )
    return clamp(score, 0.0, 100.0)


# ─── Empty / Default Fallback Objects ────────────────────────────────────────

def _empty_parsed(raw_text: str, page_count: int) -> ParsedResume:
    from app.resume.utils.text_utils import word_count
    return ParsedResume(raw_text=raw_text, word_count=word_count(raw_text), page_count=page_count)


def _empty_skill_result() -> SkillAnalysisResult:
    return SkillAnalysisResult(
        domain_match_pct=0.0,
        matched_skills=[],
        missing_skills=[],
        keyword_analysis=KeywordAnalysis(),
    )


def _empty_ats_result() -> ATSScoringResult:
    return ATSScoringResult(
        ats_score=0.0,
        breakdown=ATSBreakdown(
            keyword_score=0.0, format_score=0.0,
            length_score=0.0, section_completeness_score=0.0,
            action_verbs_score=0.0,
        ),
        weak_sections=["Could not score — parsing failed"],
        formatting_suggestions=[],
    )


def _empty_semantic_result(parsed: ParsedResume) -> SemanticScoringResult:
    from app.resume.schemas import SemanticScoringResult, ProjectRelevance
    projects = [
        ProjectRelevance(project_name=p.name, relevance_score=0.0, reasoning="Scoring unavailable.")
        for p in parsed.projects
    ]
    return SemanticScoringResult(
        semantic_match_score=0.0,
        project_relevance=projects,
        project_relevance_avg=0.0,
    )


def _empty_gemini_insights(ats_result: ATSScoringResult, skill_result: SkillAnalysisResult) -> GeminiInsights:
    return GeminiInsights(
        ai_summary="AI analysis was not available for this request.",
        top_strengths=[],
        top_improvements=ats_result.formatting_suggestions[:3],
        gemini_holistic_score=round((ats_result.ats_score + skill_result.domain_match_pct) / 2, 1),
    )
