"""
app/resume/pipelines/semantic_scorer.py
────────────────────────────────────────
Semantic similarity scoring pipeline stage using sentence-transformers.

Computes:
  - semantic_match_score  : cosine similarity between resume text and domain JD
  - project_relevance     : per-project cosine similarity to domain JD
  - project_relevance_avg : mean project relevance score

Reuses the SentenceTransformer model from app/rag/embedder.py to avoid
loading a second model instance. Falls back gracefully if embedder unavailable.
"""

from __future__ import annotations

import logging
from typing import List

import numpy as np

from app.resume.config import DOMAIN_JD_SNIPPETS, DOMAIN_SKILL_MAP
from app.resume.schemas import (
    ParsedResume,
    SemanticScoringResult,
    ProjectRelevance,
)
from app.resume.utils.text_utils import clean_skill, clamp

logger = logging.getLogger("resume.pipelines.semantic_scorer")


# ─── Model Loader ─────────────────────────────────────────────────────────────

_model = None


def _get_model():
    """
    Load the SentenceTransformer model.
    Tries to reuse the existing app.rag.embedder model first.
    Falls back to loading 'all-MiniLM-L6-v2' independently.
    """
    global _model
    if _model is not None:
        return _model

    try:
        from app.rag.embedder import model as rag_model
        _model = rag_model
        logger.info("Semantic scorer: reusing existing RAG embedder model.")
        return _model
    except Exception:
        pass

    try:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("all-MiniLM-L6-v2")
        logger.info("Semantic scorer: loaded all-MiniLM-L6-v2 independently.")
        return _model
    except Exception as exc:
        logger.warning(f"sentence-transformers not available: {exc}. Semantic scoring disabled.")
        return None


# ─── Main Entry Point ─────────────────────────────────────────────────────────

def score_semantic(
    parsed: ParsedResume,
    target_domain: str,
) -> SemanticScoringResult:
    """
    Compute semantic similarity between resume content and the domain JD.

    Args:
        parsed:        Structured ParsedResume
        target_domain: One of SUPPORTED_DOMAINS

    Returns:
        SemanticScoringResult
    """
    model = _get_model()
    if model is None:
        return _fallback_result(parsed, target_domain)

    domain_jd = DOMAIN_JD_SNIPPETS.get(target_domain, "")
    if not domain_jd:
        return _fallback_result(parsed, target_domain)

    try:
        # ── 1. Resume-level semantic similarity ───────────────────────────────
        # Use first 1000 chars of raw text to keep embedding fast
        resume_snippet = parsed.raw_text[:1500].strip()
        if not resume_snippet:
            return _fallback_result(parsed, target_domain)

        embeddings = model.encode(
            [resume_snippet, domain_jd],
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        resume_vec, jd_vec = embeddings[0], embeddings[1]
        semantic_match_score = float(np.dot(resume_vec, jd_vec))
        semantic_match_score = clamp(semantic_match_score, 0.0, 1.0)

        # ── 2. Per-project relevance ──────────────────────────────────────────
        project_relevance = _score_projects(model, parsed, domain_jd, target_domain)

        # ── 3. Project average ─────────────────────────────────────────────────
        project_relevance_avg = (
            sum(p.relevance_score for p in project_relevance) / len(project_relevance)
            if project_relevance else 0.0
        )

        logger.info(
            f"Semantic scoring [{target_domain}]: "
            f"resume={semantic_match_score:.3f}, "
            f"projects_avg={project_relevance_avg:.3f}"
        )

        return SemanticScoringResult(
            semantic_match_score=round(semantic_match_score, 4),
            project_relevance=project_relevance,
            project_relevance_avg=round(project_relevance_avg, 4),
        )

    except Exception as exc:
        logger.error(f"Semantic scoring failed: {exc}", exc_info=True)
        return _fallback_result(parsed, target_domain)


# ─── Project Relevance ────────────────────────────────────────────────────────

def _score_projects(
    model,
    parsed: ParsedResume,
    domain_jd: str,
    target_domain: str,
) -> List[ProjectRelevance]:
    """Score each project against the domain JD."""
    results: List[ProjectRelevance] = []

    if not parsed.projects:
        return results

    # Get domain required skills for technology matching
    domain_map = DOMAIN_SKILL_MAP.get(target_domain, {})
    all_domain_skills = set(
        clean_skill(s)
        for group in domain_map.values()
        for s in group
    )

    # Build project text snippets for batch embedding
    project_texts = []
    for proj in parsed.projects:
        text_parts = [proj.name]
        if proj.description:
            text_parts.append(proj.description)
        if proj.technologies:
            text_parts.append("Technologies: " + ", ".join(proj.technologies))
        project_texts.append(" ".join(text_parts))

    if not project_texts:
        return results

    try:
        # Batch encode all projects + JD together
        all_texts = project_texts + [domain_jd]
        all_embeddings = model.encode(
            all_texts,
            convert_to_numpy=True,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        jd_vec = all_embeddings[-1]
        proj_embeddings = all_embeddings[:-1]

        for i, proj in enumerate(parsed.projects):
            proj_vec = proj_embeddings[i]
            score = float(np.dot(proj_vec, jd_vec))
            score = clamp(score, 0.0, 1.0)

            # Find matched technologies vs. domain skills
            proj_techs = {clean_skill(t) for t in proj.technologies}
            matched_techs = list(proj_techs & all_domain_skills)

            # Build reasoning text
            reasoning = _build_project_reasoning(score, matched_techs, proj.name, target_domain)

            results.append(ProjectRelevance(
                project_name=proj.name,
                relevance_score=round(score, 4),
                matched_technologies=matched_techs,
                reasoning=reasoning,
            ))

    except Exception as exc:
        logger.error(f"Project embedding failed: {exc}")
        # Return zero-scored results as fallback
        for proj in parsed.projects:
            results.append(ProjectRelevance(
                project_name=proj.name,
                relevance_score=0.0,
                matched_technologies=[],
                reasoning="Could not compute semantic score.",
            ))

    return results


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _build_project_reasoning(
    score: float, matched_techs: List[str], project_name: str, domain: str
) -> str:
    if score >= 0.7:
        strength = "highly relevant"
    elif score >= 0.5:
        strength = "moderately relevant"
    elif score >= 0.3:
        strength = "somewhat relevant"
    else:
        strength = "not strongly relevant"

    reasoning = f"'{project_name}' is {strength} to the {domain} domain (score: {score:.2f})."
    if matched_techs:
        reasoning += f" Matched technologies: {', '.join(matched_techs[:5])}."
    else:
        reasoning += f" No direct technology overlap with {domain} requirements detected."

    return reasoning


def _fallback_result(parsed: ParsedResume, target_domain: str) -> SemanticScoringResult:
    """Return zero-scored result when semantic model is unavailable."""
    projects = [
        ProjectRelevance(
            project_name=proj.name,
            relevance_score=0.0,
            matched_technologies=[],
            reasoning="Semantic scoring unavailable — sentence-transformers not loaded.",
        )
        for proj in parsed.projects
    ]
    return SemanticScoringResult(
        semantic_match_score=0.0,
        project_relevance=projects,
        project_relevance_avg=0.0,
    )
