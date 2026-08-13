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
import re
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

    # For noisy PDFs, pdfplumber may return garbled text while pypdf returns cleaner text.
    # Compare quality and keep the better extraction instead of assuming parser priority.
    should_try_fallback = (
        result is None
        or len(result.full_text.strip()) < 20
        or _text_quality_score(result.full_text) < 0.60
        or not _has_resume_markers(result.full_text)
    )

    if should_try_fallback:
        logger.warning(
            f"pdfplumber returned insufficient text ({len(result.full_text.strip()) if result else 0} chars) "
            f"— trying pypdf fallback."
        )
        fallback = await _parse_with_pypdf(file_bytes)
        if result is None:
            result = fallback
        else:
            primary_score = _text_quality_score(result.full_text)
            fallback_score = _text_quality_score(fallback.full_text)
            if fallback_score > primary_score:
                logger.info(
                    "Using pypdf output over pdfplumber based on quality score "
                    "(%.3f > %.3f)",
                    fallback_score,
                    primary_score,
                )
                result = fallback

    logger.info(
        f"PDF parsed: {result.page_count} pages, "
        f"{len(result.full_text.split())} words, "
        f"method={result.extraction_method}"
    )
    return result


def _text_quality_score(text: str) -> float:
    """Estimate extracted-text quality to reject heavily garbled parser output."""
    if not text:
        return 0.0

    tokens = re.findall(r"[A-Za-z]{2,}", text)
    if not tokens:
        return 0.0

    vowelish = sum(1 for t in tokens if re.search(r"[aeiouAEIOU]", t))
    vowel_ratio = vowelish / len(tokens)

    header_hits = len(re.findall(
        r"\b(summary|skills|experience|education|projects|certifications|achievements)\b",
        text,
        flags=re.IGNORECASE,
    ))
    header_score = min(header_hits / 3.0, 1.0)

    length_score = min(len(tokens) / 120.0, 1.0)
    return 0.55 * vowel_ratio + 0.30 * header_score + 0.15 * length_score


def _has_resume_markers(text: str) -> bool:
    """Quick signal that extracted text contains likely resume structure."""
    if not text:
        return False
    if re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text):
        return True
    return bool(re.search(
        r"\b(summary|skills|experience|education|projects|certifications|achievements)\b",
        text,
        flags=re.IGNORECASE,
    ))


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
