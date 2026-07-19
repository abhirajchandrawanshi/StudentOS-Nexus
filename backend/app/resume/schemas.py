"""
app/resume/schemas.py
─────────────────────
Pydantic v2 request / response schemas for the Resume Analysis module.
"""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, model_validator


# ─── Shared Primitives ────────────────────────────────────────────────────────

class EducationEntry(BaseModel):
    institution: str
    degree: Optional[str] = None
    field: Optional[str] = None
    year: Optional[str] = None
    gpa: Optional[str] = None


class ExperienceEntry(BaseModel):
    company: str
    role: Optional[str] = None
    duration: Optional[str] = None
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)


class ProjectEntry(BaseModel):
    name: str
    description: Optional[str] = None
    technologies: List[str] = Field(default_factory=list)
    url: Optional[str] = None


class CertificationEntry(BaseModel):
    name: str
    issuer: Optional[str] = None
    year: Optional[str] = None


# ─── Parsed Resume ────────────────────────────────────────────────────────────

class ParsedResume(BaseModel):
    """Structured extraction of resume content."""

    raw_text: str = Field(default="", description="Full extracted plain text from PDF")
    word_count: int = Field(default=0)
    page_count: int = Field(default=1)

    # Extracted sections
    summary: Optional[str] = None
    skills: List[str] = Field(default_factory=list)
    experience: List[ExperienceEntry] = Field(default_factory=list)
    education: List[EducationEntry] = Field(default_factory=list)
    projects: List[ProjectEntry] = Field(default_factory=list)
    certifications: List[CertificationEntry] = Field(default_factory=list)

    # Detected contact / meta
    email_found: bool = False
    phone_found: bool = False
    linkedin_found: bool = False
    github_found: bool = False


# ─── Analysis Sub-Results ─────────────────────────────────────────────────────

class KeywordAnalysis(BaseModel):
    """Keyword presence and density analysis vs. target domain."""

    found_keywords: List[str] = Field(default_factory=list)
    missing_keywords: List[str] = Field(default_factory=list)
    keyword_density: float = Field(
        default=0.0,
        description="Fraction of domain keywords found (0.0–1.0)",
    )
    top_matched: List[str] = Field(
        default_factory=list,
        description="Top 10 most impactful matched keywords",
    )


class ProjectRelevance(BaseModel):
    """Per-project relevance scoring."""

    project_name: str
    relevance_score: float = Field(
        ge=0.0, le=1.0,
        description="Cosine similarity to domain JD (0.0–1.0)",
    )
    matched_technologies: List[str] = Field(default_factory=list)
    reasoning: str = Field(default="")


class ATSBreakdown(BaseModel):
    """Breakdown of ATS scoring components."""

    keyword_score: float = Field(ge=0.0, le=100.0)
    format_score: float = Field(ge=0.0, le=100.0)
    length_score: float = Field(ge=0.0, le=100.0)
    section_completeness_score: float = Field(ge=0.0, le=100.0)
    action_verbs_score: float = Field(ge=0.0, le=100.0)


class ImprovementSuggestion(BaseModel):
    original_text: str
    suggested_text: str
    reasoning: str

class GeminiInsights(BaseModel):
    """Structured output from Gemini AI analysis."""

    ai_summary: str = Field(
        default="",
        description="Narrative 3-paragraph feedback from Gemini",
    )
    top_strengths: List[str] = Field(default_factory=list)
    top_improvements: List[ImprovementSuggestion] = Field(default_factory=list)
    gemini_holistic_score: float = Field(
        default=50.0, ge=0.0, le=100.0,
        description="Gemini's holistic placement readiness estimate",
    )


# ─── Full Analysis Report ─────────────────────────────────────────────────────

class ResumeAnalysisReport(BaseModel):
    """Top-level response model returned to the client."""

    analysis_id: Optional[str] = Field(
        default=None,
        description="UUID of the persisted analysis (null if DB not configured)",
    )
    target_domain: str
    filename: str
    analyzed_at: datetime = Field(default_factory=datetime.utcnow)

    # ── Primary scores ──────────────────────────────────────────────
    ats_score: float = Field(ge=0.0, le=100.0, description="Overall ATS compatibility (0–100)")
    domain_match_pct: float = Field(ge=0.0, le=100.0, description="Skill overlap with domain (%)")
    placement_readiness_score: float = Field(ge=0.0, le=100.0, description="Composite readiness (0–100)")

    # ── Actionable outputs ──────────────────────────────────────────
    missing_skills: List[str] = Field(default_factory=list)
    weak_sections: List[str] = Field(default_factory=list)
    formatting_suggestions: List[str] = Field(default_factory=list)

    # ── Detailed sub-analyses ───────────────────────────────────────
    keyword_analysis: KeywordAnalysis
    project_relevance: List[ProjectRelevance] = Field(default_factory=list)
    ats_breakdown: ATSBreakdown
    gemini_insights: GeminiInsights

    # ── Raw parsed data ──────────────────────────────────────────────
    parsed: ParsedResume


# ─── Request Schemas ─────────────────────────────────────────────────────────

class DomainListResponse(BaseModel):
    """Response for GET /resume/domains."""

    domains: List[str]
    count: int


class AnalysisHistoryItem(BaseModel):
    """Summary row for history listing."""

    analysis_id: str
    filename: str
    target_domain: str
    ats_score: float
    placement_readiness_score: float
    analyzed_at: datetime


class AnalysisHistoryResponse(BaseModel):
    """Response for GET /resume/history/{user_id}."""

    user_id: str
    items: List[AnalysisHistoryItem]
    total: int


# ─── Internal Transfer Objects ────────────────────────────────────────────────
# These are used between pipeline stages (not serialised to the API consumer).

class RawResumeText(BaseModel):
    """Output of the PDF parser pipeline stage."""

    full_text: str
    page_count: int
    has_tables: bool = False
    extraction_method: str = "pdfplumber"


class SkillAnalysisResult(BaseModel):
    """Output of the skill analyser pipeline stage."""

    domain_match_pct: float
    matched_skills: List[str]
    missing_skills: List[str]
    keyword_analysis: KeywordAnalysis


class ATSScoringResult(BaseModel):
    """Output of the ATS scorer pipeline stage."""

    ats_score: float
    breakdown: ATSBreakdown
    weak_sections: List[str]
    formatting_suggestions: List[str]


class SemanticScoringResult(BaseModel):
    """Output of the semantic scorer pipeline stage."""

    semantic_match_score: float   # 0.0–1.0
    project_relevance: List[ProjectRelevance]
    project_relevance_avg: float  # 0.0–1.0
