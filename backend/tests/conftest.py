"""
tests/conftest.py
─────────────────
Shared fixtures and test infrastructure for Resume Intelligence module tests.
"""

from __future__ import annotations

import sys
from io import BytesIO
from typing import Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

# ─── Patch heavy dependencies BEFORE any app import ──────────────────────────
# This prevents sentence-transformers, chromadb and GPU code from loading during tests.

_mock_st_model = MagicMock()
_mock_st_model.encode = MagicMock(return_value=[[0.1] * 384, [0.2] * 384])

_mock_st_module = MagicMock()
_mock_st_module.SentenceTransformer = MagicMock(return_value=_mock_st_model)
sys.modules.setdefault("sentence_transformers", _mock_st_module)

_mock_embedder = MagicMock()
_mock_embedder.model = _mock_st_model
_mock_embedder.create_embeddings = MagicMock(return_value=[[0.1] * 384])
sys.modules.setdefault("app.rag.embedder", _mock_embedder)

# Mock chromadb and all RAG modules that touch it at import time
_mock_chromadb = MagicMock()
sys.modules.setdefault("chromadb", _mock_chromadb)

_mock_vectordb = MagicMock()
_mock_vectordb.collection = MagicMock()
_mock_vectordb.store_chunks = MagicMock()
sys.modules.setdefault("app.rag.vectordb", _mock_vectordb)

_mock_retriever = MagicMock()
_mock_retriever.retrieve_chunks = MagicMock(return_value=[])
sys.modules.setdefault("app.rag.retriever", _mock_retriever)

_mock_generator = MagicMock()
_mock_generator.generate_answer = MagicMock(return_value="answer")
sys.modules.setdefault("app.rag.generator", _mock_generator)

_mock_pdf_loader = MagicMock()
_mock_pdf_loader.extract_text = MagicMock(return_value="")
sys.modules.setdefault("app.rag.pdf_loader", _mock_pdf_loader)

_mock_chunker = MagicMock()
_mock_chunker.chunk_text = MagicMock(return_value=[])
sys.modules.setdefault("app.rag.chunker", _mock_chunker)

# ─── Patch google.generativeai so GEMINI_API_KEY is not required ──────────────
_mock_genai = MagicMock()
sys.modules.setdefault("google.generativeai", _mock_genai)

# ─── Now safe to import app ───────────────────────────────────────────────────
from fastapi.testclient import TestClient  # noqa: E402

from app.resume.schemas import (  # noqa: E402
    ATSBreakdown,
    ATSScoringResult,
    GeminiInsights,
    ImprovementSuggestion,
    KeywordAnalysis,
    ParsedResume,
    ProjectEntry,
    ExperienceEntry,
    EducationEntry,
    ProjectRelevance,
    RawResumeText,
    SemanticScoringResult,
    SkillAnalysisResult,
)


# ─── Minimal valid PDF bytes (text-based, parseable by pdfplumber) ─────────────

MINIMAL_PDF_BYTES = (
    b"%PDF-1.4\n"
    b"1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
    b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
    b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R"
    b"/Resources<</Font<</F1<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>>>>>"
    b"/Contents 4 0 R>>endobj\n"
    b"4 0 obj<</Length 44>>\nstream\n"
    b"BT /F1 12 Tf 100 700 Td (Test Resume) Tj ET\n"
    b"endstream\nendobj\n"
    b"xref\n0 5\n"
    b"0000000000 65535 f \n"
    b"0000000009 00000 n \n"
    b"0000000058 00000 n \n"
    b"0000000115 00000 n \n"
    b"0000000266 00000 n \n"
    b"trailer<</Size 5/Root 1 0 R>>\nstartxref\n361\n%%EOF\n"
)

SAMPLE_RESUME_TEXT = """John Developer
john@example.com | +1-555-123-4567 | linkedin.com/in/johndeveloper | github.com/johndeveloper

SUMMARY
Experienced Python Backend Developer with 4 years of experience building scalable REST APIs
and microservices using FastAPI, Django, and PostgreSQL. Passionate about clean architecture.

SKILLS
Python, FastAPI, Django, PostgreSQL, Redis, Docker, Kubernetes, REST API, GraphQL, Git,
Linux, Bash, JWT, OAuth, Microservices, Celery, RabbitMQ, MongoDB, Nginx

EXPERIENCE
Senior Backend Engineer | TechCorp | Jan 2022 - Present
- Architected and deployed 3 microservices handling 50k daily active users
- Optimised PostgreSQL queries reducing average response time by 40%
- Implemented Redis caching layer cutting database load by 60%
- Built JWT-based authentication system with OAuth 2.0 integration

Backend Developer Intern | StartupXYZ | Jun 2021 - Dec 2021
- Developed RESTful APIs using Django REST Framework
- Integrated Celery for async task processing, improving throughput by 30%

EDUCATION
B.Tech Computer Science | IIT Bombay | 2021
GPA: 8.5/10

PROJECTS
Real-Time Chat API
- Built WebSocket-based chat service using FastAPI and Redis Pub/Sub
- Technologies: Python, FastAPI, Redis, PostgreSQL, Docker

Microservices E-Commerce Platform
- Designed and implemented 5 independent microservices with Docker Compose
- Technologies: Python, FastAPI, PostgreSQL, Kafka, Docker, Kubernetes

CERTIFICATIONS
AWS Certified Developer - Associate | 2023
"""


# ─── Schema Factories ─────────────────────────────────────────────────────────

def make_parsed_resume(text: str = SAMPLE_RESUME_TEXT) -> ParsedResume:
    return ParsedResume(
        raw_text=text,
        word_count=len(text.split()),
        page_count=1,
        summary="Experienced Backend Developer with 4 years experience.",
        skills=["python", "fastapi", "django", "postgresql", "redis", "docker",
                "kubernetes", "rest api", "git", "linux", "jwt", "oauth", "celery"],
        experience=[
            ExperienceEntry(
                company="TechCorp",
                role="Senior Backend Engineer",
                duration="Jan 2022 - Present",
                description="Architected microservices handling 50k users.",
                technologies=["python", "fastapi", "postgresql", "redis", "docker"],
            ),
            ExperienceEntry(
                company="StartupXYZ",
                role="Backend Developer Intern",
                duration="Jun 2021 - Dec 2021",
                description="Developed RESTful APIs using Django REST Framework.",
                technologies=["django", "celery"],
            ),
        ],
        education=[EducationEntry(institution="IIT Bombay", degree="B.Tech", field="Computer Science", year="2021")],
        projects=[
            ProjectEntry(
                name="Real-Time Chat API",
                description="WebSocket chat service using FastAPI and Redis.",
                technologies=["python", "fastapi", "redis", "postgresql", "docker"],
            ),
            ProjectEntry(
                name="Microservices Platform",
                description="5 independent microservices with Docker Compose.",
                technologies=["python", "fastapi", "postgresql", "kafka", "docker", "kubernetes"],
            ),
        ],
        certifications=[],
        email_found=True,
        phone_found=True,
        linkedin_found=True,
        github_found=True,
    )


def make_raw_resume_text(text: str = SAMPLE_RESUME_TEXT) -> RawResumeText:
    return RawResumeText(
        full_text=text,
        page_count=2,
        has_tables=False,
        extraction_method="pdfplumber",
    )


def make_skill_result() -> SkillAnalysisResult:
    return SkillAnalysisResult(
        domain_match_pct=72.0,
        matched_skills=["python", "fastapi", "postgresql", "redis", "docker", "rest api", "jwt"],
        missing_skills=["grpc", "kafka", "elasticsearch"],
        keyword_analysis=KeywordAnalysis(
            found_keywords=["python", "fastapi", "postgresql", "redis"],
            missing_keywords=["grpc", "kafka", "elasticsearch"],
            keyword_density=0.72,
            top_matched=["python", "fastapi", "postgresql"],
        ),
    )


def make_ats_result() -> ATSScoringResult:
    return ATSScoringResult(
        ats_score=78.5,
        breakdown=ATSBreakdown(
            keyword_score=72.0,
            format_score=90.0,
            length_score=85.0,
            section_completeness_score=80.0,
            action_verbs_score=70.0,
        ),
        weak_sections=[],
        formatting_suggestions=["Add more quantifiable achievements."],
    )


def make_semantic_result() -> SemanticScoringResult:
    return SemanticScoringResult(
        semantic_match_score=0.78,
        project_relevance=[
            ProjectRelevance(
                project_name="Real-Time Chat API",
                relevance_score=0.82,
                matched_technologies=["python", "fastapi", "redis"],
                reasoning="Highly relevant to Backend Developer domain.",
            )
        ],
        project_relevance_avg=0.82,
    )


def make_gemini_insights() -> GeminiInsights:
    return GeminiInsights(
        ai_summary="Strong backend resume with clear evidence of scalable system design.",
        top_strengths=["FastAPI expertise", "Microservices experience", "Quantified impact"],
        top_improvements=[
            ImprovementSuggestion(
                original_text="worked on tasks",
                suggested_text="Engineered solutions resulting in 40% latency reduction",
                reasoning="Adds measurable impact.",
            )
        ],
        gemini_holistic_score=75.0,
        placement_readiness_level="Almost Ready",
        learning_roadmap=["Learn gRPC for inter-service communication", "Add Kafka streaming experience"],
        missing_competencies=["gRPC", "Kafka streams", "Elasticsearch"],
    )


# ─── App Fixture ──────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def test_client() -> Generator[TestClient, None, None]:
    """FastAPI TestClient (no real DB, no Gemini key required)."""
    from app.main import app
    with TestClient(app, raise_server_exceptions=False) as client:
        yield client


# ─── PDF Fixtures ─────────────────────────────────────────────────────────────

@pytest.fixture
def pdf_bytes() -> bytes:
    return MINIMAL_PDF_BYTES


@pytest.fixture
def sample_text() -> str:
    return SAMPLE_RESUME_TEXT


@pytest.fixture
def parsed_resume() -> ParsedResume:
    return make_parsed_resume()


@pytest.fixture
def raw_resume_text() -> RawResumeText:
    return make_raw_resume_text()


@pytest.fixture
def skill_result() -> SkillAnalysisResult:
    return make_skill_result()


@pytest.fixture
def ats_result() -> ATSScoringResult:
    return make_ats_result()


@pytest.fixture
def semantic_result() -> SemanticScoringResult:
    return make_semantic_result()


@pytest.fixture
def gemini_insights() -> GeminiInsights:
    return make_gemini_insights()
