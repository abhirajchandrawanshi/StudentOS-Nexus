"""
tests/test_pdf_parser.py
─────────────────────────
Tests for the PDF text extraction pipeline.
"""

from __future__ import annotations

import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.resume.schemas import RawResumeText


SAMPLE_TEXT = "John Doe\njohn@example.com\nSKILLS\nPython, FastAPI, PostgreSQL"


# ─── extract_pdf_text ─────────────────────────────────────────────────────────

class TestExtractPdfText:
    @pytest.mark.asyncio
    async def test_empty_bytes_returns_empty_result(self):
        from app.resume.pipelines.pdf_parser import extract_pdf_text

        result = await extract_pdf_text(b"", "empty.pdf")
        assert result.full_text == ""
        assert result.page_count == 0
        assert result.extraction_method == "empty"

    @pytest.mark.asyncio
    async def test_pdfplumber_primary_parser(self):
        from app.resume.pipelines.pdf_parser import extract_pdf_text

        mock_page = MagicMock()
        mock_page.extract_text.return_value = SAMPLE_TEXT
        mock_page.extract_tables.return_value = []

        mock_pdf = MagicMock()
        mock_pdf.__enter__ = MagicMock(return_value=mock_pdf)
        mock_pdf.__exit__ = MagicMock(return_value=False)
        mock_pdf.pages = [mock_page, mock_page]

        with patch("pdfplumber.open", return_value=mock_pdf):
            result = await extract_pdf_text(b"%PDF fake", "resume.pdf")

        assert result.extraction_method == "pdfplumber"
        assert result.page_count == 2
        assert "John Doe" in result.full_text

    @pytest.mark.asyncio
    async def test_falls_back_to_pypdf_when_pdfplumber_fails(self):
        from app.resume.pipelines.pdf_parser import extract_pdf_text

        mock_reader = MagicMock()
        mock_page = MagicMock()
        mock_page.extract_text.return_value = SAMPLE_TEXT
        mock_reader.pages = [mock_page]

        with patch("pdfplumber.open", side_effect=Exception("pdfplumber error")):
            with patch("app.resume.pipelines.pdf_parser._parse_with_pypdf",
                       new=AsyncMock(return_value=__import__(
                           'app.resume.schemas', fromlist=['RawResumeText']
                       ).RawResumeText(
                           full_text=SAMPLE_TEXT,
                           page_count=1,
                           has_tables=False,
                           extraction_method="pypdf",
                       ))):
                result = await extract_pdf_text(b"%PDF fake", "resume.pdf")

        assert result.extraction_method == "pypdf"
        assert "John Doe" in result.full_text

    @pytest.mark.asyncio
    async def test_pdfplumber_insufficient_text_triggers_fallback(self):
        """If pdfplumber returns < 20 chars, should trigger pypdf fallback."""
        from app.resume.pipelines.pdf_parser import extract_pdf_text
        from app.resume.schemas import RawResumeText

        mock_page = MagicMock()
        mock_page.extract_text.return_value = "short"
        mock_page.extract_tables.return_value = []

        mock_pdf = MagicMock()
        mock_pdf.__enter__ = MagicMock(return_value=mock_pdf)
        mock_pdf.__exit__ = MagicMock(return_value=False)
        mock_pdf.pages = [mock_page]

        fallback_result = RawResumeText(
            full_text=SAMPLE_TEXT, page_count=1, has_tables=False, extraction_method="pypdf"
        )

        with patch("pdfplumber.open", return_value=mock_pdf):
            with patch(
                "app.resume.pipelines.pdf_parser._parse_with_pypdf",
                new=AsyncMock(return_value=fallback_result),
            ):
                result = await extract_pdf_text(b"%PDF fake", "resume.pdf")

        assert len(result.full_text.strip()) > 10

    @pytest.mark.asyncio
    async def test_table_content_is_included(self):
        """Table rows extracted by pdfplumber should appear in full_text."""
        from app.resume.pipelines.pdf_parser import extract_pdf_text

        mock_page = MagicMock()
        mock_page.extract_text.return_value = "Resume Header\n" * 5
        mock_page.extract_tables.return_value = [
            [["Python", "FastAPI"], ["Docker", "Kubernetes"]]
        ]

        mock_pdf = MagicMock()
        mock_pdf.__enter__ = MagicMock(return_value=mock_pdf)
        mock_pdf.__exit__ = MagicMock(return_value=False)
        mock_pdf.pages = [mock_page]

        with patch("pdfplumber.open", return_value=mock_pdf):
            result = await extract_pdf_text(b"%PDF fake", "resume.pdf")

        assert result.has_tables is True

    @pytest.mark.asyncio
    async def test_result_has_correct_fields(self):
        from app.resume.pipelines.pdf_parser import extract_pdf_text

        mock_page = MagicMock()
        mock_page.extract_text.return_value = SAMPLE_TEXT * 5
        mock_page.extract_tables.return_value = []

        mock_pdf = MagicMock()
        mock_pdf.__enter__ = MagicMock(return_value=mock_pdf)
        mock_pdf.__exit__ = MagicMock(return_value=False)
        mock_pdf.pages = [mock_page]

        with patch("pdfplumber.open", return_value=mock_pdf):
            result = await extract_pdf_text(b"%PDF fake", "resume.pdf")

        assert isinstance(result, RawResumeText)
        assert isinstance(result.full_text, str)
        assert isinstance(result.page_count, int)
        assert isinstance(result.has_tables, bool)
        assert result.extraction_method != ""

    @pytest.mark.asyncio
    async def test_uses_pypdf_when_pdfplumber_output_is_garbled(self):
        from app.resume.pipelines.pdf_parser import extract_pdf_text

        garbled = RawResumeText(
            full_text="xqz--brt--mnp--zzz",
            page_count=1,
            has_tables=False,
            extraction_method="pdfplumber",
        )
        clean = RawResumeText(
            full_text="SUMMARY\nBackend Developer\nSKILLS\nPython, FastAPI",
            page_count=1,
            has_tables=False,
            extraction_method="pypdf",
        )

        with (
            patch("app.resume.pipelines.pdf_parser._parse_with_pdfplumber", new=AsyncMock(return_value=garbled)),
            patch("app.resume.pipelines.pdf_parser._parse_with_pypdf", new=AsyncMock(return_value=clean)),
        ):
            result = await extract_pdf_text(b"%PDF fake", "resume.pdf")

        assert result.extraction_method == "pypdf"
        assert "SUMMARY" in result.full_text
