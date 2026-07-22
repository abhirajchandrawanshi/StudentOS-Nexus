"""
app/resume/utils/text_utils.py
──────────────────────────────
Text cleaning and normalisation utilities shared across pipeline stages.
"""

from __future__ import annotations

import re
import unicodedata
from typing import List, Set


# ─── Text Cleaning ────────────────────────────────────────────────────────────

def normalise_text(text: str) -> str:
    """
    Normalise Unicode, collapse whitespace, and strip control characters.
    Preserves newlines as section separators.
    """
    # Unicode normalisation (NFC → consistent codepoints)
    text = unicodedata.normalize("NFC", text)

    # Replace common ligatures and special dashes
    text = text.replace("\ufb01", "fi").replace("\ufb02", "fl")
    text = re.sub(r"[–—]", "-", text)
    text = re.sub(r"[“”]", '"', text)
    text = re.sub(r"[‘’]", "'", text)

    # Remove control characters (keep \n and \t)
    text = re.sub(r"[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]", "", text)

    # Collapse multiple spaces (but keep single newlines)
    text = re.sub(r"[^\S\n]+", " ", text)

    # Collapse 3+ consecutive newlines to 2
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def clean_skill(skill: str) -> str:
    """Normalise a single skill string: lowercase, strip punctuation."""
    skill = skill.strip().lower()
    skill = re.sub(r"[^\w\s./#+\-]", "", skill)
    skill = re.sub(r"\s+", " ", skill)
    return skill


def deduplicate_skills(skills: List[str]) -> List[str]:
    """Remove duplicate skills (case-insensitive, order-preserving)."""
    seen: Set[str] = set()
    result: List[str] = []
    for s in skills:
        cleaned = clean_skill(s)
        if cleaned and cleaned not in seen:
            seen.add(cleaned)
            result.append(cleaned)
    return result


# ─── Contact Detection ────────────────────────────────────────────────────────

EMAIL_RE = re.compile(r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}")
PHONE_RE = re.compile(
    r"(\+?\d[\d\s\-().]{8,}\d)"
)
LINKEDIN_RE = re.compile(r"linkedin\.com/in/[\w\-]+", re.IGNORECASE)
GITHUB_RE   = re.compile(r"github\.com/[\w\-]+", re.IGNORECASE)


def detect_contact_info(text: str) -> dict:
    """Return booleans for email, phone, LinkedIn, GitHub presence."""
    return {
        "email_found":    bool(EMAIL_RE.search(text)),
        "phone_found":    bool(PHONE_RE.search(text)),
        "linkedin_found": bool(LINKEDIN_RE.search(text)),
        "github_found":   bool(GITHUB_RE.search(text)),
    }


# ─── Word Count ───────────────────────────────────────────────────────────────

def word_count(text: str) -> int:
    """Return approximate word count (split on whitespace)."""
    return len(text.split())


# ─── Bullet / Line Parsing ────────────────────────────────────────────────────

BULLET_RE = re.compile(r"^[\s\u2022\u2023\u25e6\u2043\u2219•◦‣⁃\-*>]+", re.MULTILINE)


def strip_bullets(text: str) -> str:
    """Remove leading bullet characters from each line."""
    return BULLET_RE.sub("", text).strip()


def split_into_lines(text: str) -> List[str]:
    """Split text into non-empty lines."""
    return [line.strip() for line in text.splitlines() if line.strip()]


# ─── URL Extraction ───────────────────────────────────────────────────────────

URL_RE = re.compile(
    r"https?://[^\s)>\"']+|www\.[^\s)>\"']+",
    re.IGNORECASE,
)


def extract_urls(text: str) -> List[str]:
    """Extract all URLs from the given text."""
    return URL_RE.findall(text)


# ─── Technology Extraction Helpers ────────────────────────────────────────────

TECH_SPLITTER = re.compile(r"[,|/•·\n\t]+")


def split_tech_tokens(text: str) -> List[str]:
    """
    Split a comma/pipe/bullet-separated tech list into individual tokens.
    e.g. "Python, FastAPI | PostgreSQL • Redis" → ["Python", "FastAPI", ...]
    """
    tokens = TECH_SPLITTER.split(text)
    return [t.strip() for t in tokens if t.strip() and len(t.strip()) > 1]


# ─── Score Clamping ───────────────────────────────────────────────────────────

def clamp(value: float, lo: float = 0.0, hi: float = 100.0) -> float:
    """Clamp a float to [lo, hi]."""
    return max(lo, min(hi, value))
