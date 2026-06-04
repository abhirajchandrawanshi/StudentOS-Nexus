"""
app/resume/pipelines/pdf_parser.py
───────────────────────────────────
PDF text extraction pipeline stage.

Strategy:
  1. Try pdfplumber with BytesIO (no temp files — avoids Windows file lock issues)
  2. Fall back to pypdf if pdfplumber fails or returns empty text

Both approaches work directly from raw bytes, avoiding any temp file creation.
"""

from __future__ import annotations

import io
import logging
from typing import Optional

from app.resume.schemas import RawResumeText
from app.resume.utils.text_utils import normalise_text

logger = logging.getLogger("resume.pipelines.pdf_parser")


async def extract_pdf_text(file_bytes: bytes, filename: str = "resume.pdf") -> RawResumeText:
    """
    Primary entry point: accepts raw PDF bytes, returns RawResumeText.
    Uses in-memory BytesIO — no temp files, no Windows file-lock issues.
    """
    if not file_bytes:
        logger.error("extract_pdf_text received empty bytes")
        return RawResumeText(full_text="", page_count=0, extraction_method="empty")

    result = await _parse_with_pdfplumber(file_bytes)

    if not result or len(result.full_text.strip()) < 20:
        logger.warning(
            f"pdfplumber returned insufficient text ({len(result.full_text.strip()) if result else 0} chars) "
            f"— trying pypdf fallback."
        )
        result = await _parse_with_pypdf(file_bytes)

    logger.info(
        f"PDF parsed: {result.page_count} pages, "
        f"{len(result.full_text.split())} words, "
        f"method={result.extraction_method}"
    )
    return result


# ─── pdfplumber ───────────────────────────────────────────────────────────────

async def _parse_with_pdfplumber(file_bytes: bytes) -> Optional[RawResumeText]:
    try:
        import pdfplumber
    except ImportError:
        logger.warning("pdfplumber not installed — skipping.")
        return None

    try:
        pages_text: list[str] = []
        has_tables = False
        stream = io.BytesIO(file_bytes)

        with pdfplumber.open(stream) as pdf:
            page_count = len(pdf.pages)
            for page in pdf.pages:
                # Extract plain text
                text = page.extract_text(x_tolerance=3, y_tolerance=3) or ""

                # Also extract table content
                try:
                    tables = page.extract_tables()
                    if tables:
                        has_tables = True
                        for table in tables:
                            for row in table:
                                if row:
                                    row_text = " | ".join(
                                        str(cell).strip() if cell else "" for cell in row
                                    )
                                    if row_text.strip() and row_text not in text:
                                        text += "\n" + row_text
                except Exception as table_err:
                    logger.debug(f"Table extraction skipped: {table_err}")

                pages_text.append(text)

        full_text = normalise_text("\n\n".join(pages_text))
        logger.info(
            f"pdfplumber: {page_count} pages, {len(full_text.split())} words, "
            f"tables={has_tables}, raw_chars={len(full_text)}"
        )
        return RawResumeText(
            full_text=full_text,
            page_count=page_count,
            has_tables=has_tables,
            extraction_method="pdfplumber",
        )

    except Exception as exc:
        logger.error(f"pdfplumber extraction failed: {exc}", exc_info=True)
        return None


# ─── pypdf fallback ───────────────────────────────────────────────────────────

async def _parse_with_pypdf(file_bytes: bytes) -> RawResumeText:
    # Try pypdf first (newer, better maintained)
    try:
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(file_bytes))
        page_count = len(reader.pages)
        pages_text = []
        for page in reader.pages:
            text = page.extract_text() or ""
            pages_text.append(text)

        full_text = normalise_text("\n\n".join(pages_text))
        if full_text.strip():
            logger.info(f"pypdf: {page_count} pages, {len(full_text.split())} words")
            return RawResumeText(
                full_text=full_text,
                page_count=page_count,
                has_tables=False,
                extraction_method="pypdf",
            )
    except ImportError:
        pass
    except Exception as exc:
        logger.error(f"pypdf extraction failed: {exc}", exc_info=True)

    # Try PyPDF2 as last resort
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        page_count = len(reader.pages)
        pages_text = [page.extract_text() or "" for page in reader.pages]
        full_text = normalise_text("\n\n".join(pages_text))
        if full_text.strip():
            logger.info(f"PyPDF2 fallback: {page_count} pages, {len(full_text.split())} words")
            return RawResumeText(
                full_text=full_text,
                page_count=page_count,
                has_tables=False,
                extraction_method="PyPDF2",
            )
    except Exception:
        pass

    logger.error("All PDF parsers returned empty text.")
    return RawResumeText(
        full_text="",
        page_count=0,
        extraction_method="failed",
    )
