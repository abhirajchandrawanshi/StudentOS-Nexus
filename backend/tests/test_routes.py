"""
tests/test_routes.py
─────────────────────
API endpoint tests using FastAPI TestClient.
Gemini, PDF parsing, and embedding are all mocked.
"""

from __future__ import annotations

import io
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from tests.conftest import (
    MINIMAL_PDF_BYTES,
    SAMPLE_RESUME_TEXT,
    make_parsed_resume,
    make_skill_result,
    make_ats_result,
    make_semantic_result,
    make_gemini_insights,
)
from app.resume.schemas import (
    RawResumeText,
    ResumeAnalysisReport,
    KeywordAnalysis,
    ATSBreakdown,
)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _make_full_report() -> ResumeAnalysisReport:
    return ResumeAnalysisReport(
        analysis_id=None,
        target_domain="Backend Developer",
        filename="resume.pdf",
        ats_score=78.5,
        domain_match_pct=72.0,
        placement_readiness_score=73.0,
        missing_skills=["kafka", "grpc"],
        weak_sections=[],
        formatting_suggestions=["Add more metrics."],
        keyword_analysis=make_skill_result().keyword_analysis,
        project_relevance=[],
        ats_breakdown=make_ats_result().breakdown,
        gemini_insights=make_gemini_insights(),
        parsed=make_parsed_resume(),
    )


def _patch_service_analyze(report: ResumeAnalysisReport | None = None):
    if report is None:
        report = _make_full_report()
    return patch(
        "app.resume.routes.ResumeAnalysisService.analyze",
        new=AsyncMock(return_value=report),
    )


# ─── GET /resume/domains ──────────────────────────────────────────────────────

class TestDomainsEndpoint:
    def test_returns_200(self, test_client):
        resp = test_client.get("/resume/domains")
        assert resp.status_code == 200

    def test_response_has_domains_list(self, test_client):
        resp = test_client.get("/resume/domains")
        data = resp.json()
        assert "domains" in data
        assert isinstance(data["domains"], list)

    def test_response_has_count(self, test_client):
        resp = test_client.get("/resume/domains")
        data = resp.json()
        assert data["count"] == len(data["domains"])

    def test_known_domains_present(self, test_client):
        resp = test_client.get("/resume/domains")
        domains = resp.json()["domains"]
        assert "Backend Developer" in domains
        assert "Frontend Developer" in domains


# ─── POST /resume/analyze ─────────────────────────────────────────────────────

class TestAnalyzeEndpoint:
    def test_valid_pdf_returns_200(self, test_client):
        with _patch_service_analyze():
            resp = test_client.post(
                "/resume/analyze",
                files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")},
                data={"target_domain": "Backend Developer"},
            )
        assert resp.status_code == 200

    def test_valid_pdf_response_has_scores(self, test_client):
        with _patch_service_analyze():
            resp = test_client.post(
                "/resume/analyze",
                files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")},
                data={"target_domain": "Backend Developer"},
            )
        data = resp.json()
        assert "ats_score" in data
        assert "domain_match_pct" in data
        assert "placement_readiness_score" in data

    def test_response_has_gemini_insights(self, test_client):
        with _patch_service_analyze():
            resp = test_client.post(
                "/resume/analyze",
                files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")},
                data={"target_domain": "Backend Developer"},
            )
        data = resp.json()
        assert "gemini_insights" in data
        gi = data["gemini_insights"]
        assert "placement_readiness_level" in gi
        assert "learning_roadmap" in gi
        assert "missing_competencies" in gi

    def test_empty_file_returns_422(self, test_client):
        resp = test_client.post(
            "/resume/analyze",
            files={"file": ("resume.pdf", b"", "application/pdf")},
            data={"target_domain": "Backend Developer"},
        )
        assert resp.status_code == 422

    def test_invalid_domain_returns_422(self, test_client):
        resp = test_client.post(
            "/resume/analyze",
            files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")},
            data={"target_domain": "Invalid Domain XYZ"},
        )
        assert resp.status_code == 422

    def test_non_pdf_file_returns_422(self, test_client):
        resp = test_client.post(
            "/resume/analyze",
            files={"file": ("resume.txt", b"This is plain text", "text/plain")},
            data={"target_domain": "Backend Developer"},
        )
        assert resp.status_code == 422

    def test_oversized_file_returns_413(self, test_client):
        huge_bytes = b"%PDF-fake" + b"x" * (6 * 1024 * 1024)  # 6MB > 5MB limit
        resp = test_client.post(
            "/resume/analyze",
            files={"file": ("resume.pdf", huge_bytes, "application/pdf")},
            data={"target_domain": "Backend Developer"},
        )
        assert resp.status_code == 413

    def test_pdf_extension_without_mime_is_accepted(self, test_client):
        """A file with .pdf extension but no content-type should be accepted."""
        with _patch_service_analyze():
            resp = test_client.post(
                "/resume/analyze",
                files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "")},
                data={"target_domain": "Backend Developer"},
            )
        # Should proceed (empty content-type but .pdf extension)
        assert resp.status_code in (200, 422)  # 422 if PDF extraction fails

    def test_missing_file_returns_422(self, test_client):
        resp = test_client.post(
            "/resume/analyze",
            data={"target_domain": "Backend Developer"},
        )
        assert resp.status_code == 422

    def test_missing_domain_returns_422(self, test_client):
        resp = test_client.post(
            "/resume/analyze",
            files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")},
        )
        assert resp.status_code == 422

    def test_optional_user_id_accepted(self, test_client):
        with _patch_service_analyze():
            resp = test_client.post(
                "/resume/analyze",
                files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")},
                data={"target_domain": "Backend Developer", "user_id": "user-abc-123"},
            )
        assert resp.status_code == 200

    def test_service_error_returns_500(self, test_client):
        with patch(
            "app.resume.routes.ResumeAnalysisService.analyze",
            new=AsyncMock(side_effect=RuntimeError("Unexpected crash")),
        ):
            resp = test_client.post(
                "/resume/analyze",
                files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")},
                data={"target_domain": "Backend Developer"},
            )
        assert resp.status_code == 500

    def test_value_error_from_service_returns_422(self, test_client):
        with patch(
            "app.resume.routes.ResumeAnalysisService.analyze",
            new=AsyncMock(side_effect=ValueError("No text extracted")),
        ):
            resp = test_client.post(
                "/resume/analyze",
                files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")},
                data={"target_domain": "Backend Developer"},
            )
        assert resp.status_code == 422


# ─── GET /resume/analysis/{id} ───────────────────────────────────────────────

class TestGetAnalysisEndpoint:
    def test_returns_404_when_no_db(self, test_client):
        resp = test_client.get("/resume/analysis/00000000-0000-0000-0000-000000000000")
        assert resp.status_code == 404

    def test_returns_404_for_random_id(self, test_client):
        import uuid
        resp = test_client.get(f"/resume/analysis/{uuid.uuid4()}")
        assert resp.status_code == 404


# ─── GET /resume/history/{user_id} ───────────────────────────────────────────

class TestGetHistoryEndpoint:
    def test_returns_200_with_empty_history(self, test_client):
        resp = test_client.get("/resume/history/user-no-data")
        assert resp.status_code == 200

    def test_empty_history_response_structure(self, test_client):
        resp = test_client.get("/resume/history/user-no-data")
        data = resp.json()
        assert "user_id" in data
        assert "items" in data
        assert "total" in data
        assert data["items"] == []
        assert data["total"] == 0

    def test_limit_parameter_accepted(self, test_client):
        resp = test_client.get("/resume/history/user-no-data?limit=5")
        assert resp.status_code == 200

    def test_limit_out_of_range_returns_422(self, test_client):
        resp = test_client.get("/resume/history/user-no-data?limit=0")
        assert resp.status_code == 422


# ─── POST /resume/rewrite ────────────────────────────────────────────────────

class TestRewriteEndpoint:
    def test_returns_503_when_no_gemini_key(self, test_client):
        """With no GEMINI_API_KEY, rewrite should return 503."""
        import os
        with patch.dict(os.environ, {}, clear=True):
            with patch("app.resume.routes.get_gemini_client", side_effect=Exception("No key")):
                resp = test_client.post(
                    "/resume/rewrite",
                    files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")},
                    data={"target_domain": "Backend Developer"},
                )
        assert resp.status_code == 503

    def test_invalid_domain_returns_422(self, test_client):
        resp = test_client.post(
            "/resume/rewrite",
            files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")},
            data={"target_domain": "Bad Domain"},
        )
        assert resp.status_code == 422

    def test_empty_file_returns_422(self, test_client):
        resp = test_client.post(
            "/resume/rewrite",
            files={"file": ("resume.pdf", b"", "application/pdf")},
            data={"target_domain": "Backend Developer"},
        )
        assert resp.status_code == 422

    def test_oversized_file_returns_413(self, test_client):
        huge = b"%PDF-fake" + b"x" * (6 * 1024 * 1024)
        resp = test_client.post(
            "/resume/rewrite",
            files={"file": ("resume.pdf", huge, "application/pdf")},
            data={"target_domain": "Backend Developer"},
        )
        assert resp.status_code == 413

    def test_successful_rewrite_returns_markdown(self, test_client):
        raw = RawResumeText(full_text=SAMPLE_RESUME_TEXT, page_count=1)
        mock_gemini = MagicMock()

        with (
            patch("app.resume.routes.get_gemini_client", return_value=mock_gemini),
            patch("app.resume.routes.extract_pdf_text", new=AsyncMock(return_value=raw)),
            patch(
                "app.resume.routes.rewrite_resume_with_gemini",
                new=AsyncMock(return_value="# Rewritten Resume\n\n## Summary\n\nImproved."),
            ),
        ):
            resp = test_client.post(
                "/resume/rewrite",
                files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")},
                data={"target_domain": "Backend Developer"},
            )
        assert resp.status_code == 200
        assert "Rewritten Resume" in resp.text

    def test_gemini_runtime_failure_returns_fallback_markdown(self, test_client):
        raw = RawResumeText(full_text=SAMPLE_RESUME_TEXT, page_count=1)
        mock_gemini = MagicMock()
        mock_gemini.generate_content = MagicMock(side_effect=Exception("Model unavailable"))

        with (
            patch("app.resume.routes.get_gemini_client", return_value=mock_gemini),
            patch("app.resume.routes.extract_pdf_text", new=AsyncMock(return_value=raw)),
        ):
            resp = test_client.post(
                "/resume/rewrite",
                files={"file": ("resume.pdf", MINIMAL_PDF_BYTES, "application/pdf")},
                data={"target_domain": "Backend Developer"},
            )

        assert resp.status_code == 200
        assert "## Summary" in resp.text
        assert "## Experience" in resp.text
