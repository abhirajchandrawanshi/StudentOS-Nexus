"""
app/resume/pipelines/section_extractor.py
──────────────────────────────────────────
Resume section segmentation pipeline stage.

Splits raw text into labelled sections (skills, experience, education,
projects, certifications, summary) using:
  - Regex header matching (fast, language-agnostic)
  - Heuristic content parsing for structured entries

Does NOT require spaCy to be loaded for basic extraction.
spaCy is used optionally for NER-enhanced organisation extraction.
"""

from __future__ import annotations

import re
import logging
from typing import Dict, List, Optional, Tuple

from app.resume.config import SECTION_PATTERNS
from app.resume.schemas import (
    ParsedResume,
    RawResumeText,
    EducationEntry,
    ExperienceEntry,
    ProjectEntry,
    CertificationEntry,
)
from app.resume.utils.text_utils import (
    clean_skill,
    deduplicate_skills,
    detect_contact_info,
    split_tech_tokens,
    strip_bullets,
    split_into_lines,
    extract_urls,
    word_count,
)

logger = logging.getLogger("resume.pipelines.section_extractor")

# Pre-compile all section header regexes for speed
_COMPILED_PATTERNS: Dict[str, List[re.Pattern]] = {
    section: [re.compile(p, re.IGNORECASE) for p in patterns]
    for section, patterns in SECTION_PATTERNS.items()
}

# Matches a standalone section header line (short line ending with colon or all-caps)
_HEADER_LINE_RE = re.compile(
    r"^(.{2,50}?)[\s:]*$", re.MULTILINE
)

# Date patterns used to detect experience/education entries
_DATE_RE = re.compile(
    r"\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|"
    r"march|april|june|july|august|september|october|november|december|"
    r"20\d{2}|19\d{2}|present|current)\b",
    re.IGNORECASE,
)

# GPA detection
_GPA_RE = re.compile(r"\b(gpa|cgpa|grade)\b.*?([\d.]+)\s*(/\s*[\d.]+)?", re.IGNORECASE)


# ─── Main Entry Point ─────────────────────────────────────────────────────────

def parse_resume_sections(raw: RawResumeText) -> ParsedResume:
    """
    Parse raw resume text into a structured ParsedResume object.
    """
    text = raw.full_text

    # 1. Detect contact info
    contact = detect_contact_info(text)

    # 2. Split text into sections
    sections = _split_into_sections(text)
    logger.debug(f"Detected sections: {list(sections.keys())}")

    # 3. Parse each section
    skills = _parse_skills(sections.get("skills", ""))
    experience = _parse_experience(sections.get("experience", ""))
    education = _parse_education(sections.get("education", ""))
    projects = _parse_projects(sections.get("projects", ""))
    certifications = _parse_certifications(sections.get("certifications", ""))
    summary = sections.get("summary", "").strip() or None

    return ParsedResume(
        raw_text=text,
        word_count=word_count(text),
        page_count=raw.page_count,
        summary=summary,
        skills=skills,
        experience=experience,
        education=education,
        projects=projects,
        certifications=certifications,
        **contact,
    )


# ─── Section Splitter ─────────────────────────────────────────────────────────

def _split_into_sections(text: str) -> Dict[str, str]:
    """
    Identify section headers and split text into labelled chunks.
    Returns a dict: section_name → section_content.
    """
    lines = text.splitlines()
    sections: Dict[str, str] = {}
    current_section: Optional[str] = None
    current_lines: List[str] = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_lines:
                current_lines.append("")
            continue

        detected = _detect_section_header(stripped)
        if detected:
            # Save previous section
            if current_section and current_lines:
                sections[current_section] = "\n".join(current_lines).strip()
            current_section = detected
            current_lines = []
        else:
            if current_section:
                current_lines.append(stripped)
            else:
                # Before any recognised header → treat as summary
                sections.setdefault("summary", "")
                sections["summary"] += " " + stripped

    # Save last section
    if current_section and current_lines:
        sections[current_section] = "\n".join(current_lines).strip()

    return sections


def _detect_section_header(line: str) -> Optional[str]:
    """
    Check if a line matches a known section header pattern.
    Returns the canonical section name or None.
    """
    # Skip very long lines (these are content, not headers)
    if len(line) > 60:
        return None

    for section, patterns in _COMPILED_PATTERNS.items():
        for pat in patterns:
            if pat.search(line):
                return section
    return None


# ─── Skills Parser ───────────────────────────────────────────────────────────

def _parse_skills(text: str) -> List[str]:
    """Extract a flat list of cleaned, deduplicated skills."""
    if not text:
        return []

    raw_skills: List[str] = []
    for line in split_into_lines(text):
        line = strip_bullets(line)
        # Handle "Category: skill1, skill2" patterns
        if ":" in line:
            _, rest = line.split(":", 1)
            tokens = split_tech_tokens(rest)
        else:
            tokens = split_tech_tokens(line)
        raw_skills.extend(tokens)

    return deduplicate_skills(raw_skills)


# ─── Experience Parser ────────────────────────────────────────────────────────

def _parse_experience(text: str) -> List[ExperienceEntry]:
    """Parse work experience entries."""
    if not text:
        return []

    entries: List[ExperienceEntry] = []
    blocks = _split_into_blocks(text)

    for block in blocks:
        if not block.strip():
            continue
        lines = split_into_lines(block)
        if not lines:
            continue

        # First non-empty line is company/role header
        header = lines[0]
        role, company, duration = _parse_experience_header(header)

        # Rest is description
        desc_lines = lines[1:]
        description = " ".join(strip_bullets(l) for l in desc_lines if l).strip()

        # Extract tech from description
        techs = _extract_tech_from_description(description)

        entries.append(ExperienceEntry(
            company=company or header,
            role=role,
            duration=duration,
            description=description[:800] if description else None,  # cap length
            technologies=techs,
        ))

    return entries


def _parse_experience_header(line: str) -> Tuple[Optional[str], Optional[str], Optional[str]]:
    """
    Attempt to extract role, company, and duration from a single header line.
    Handles patterns like "Software Engineer — Google | Jan 2023 – Present"
    """
    # Extract date range
    dates = _DATE_RE.findall(line)
    duration = None
    if len(dates) >= 1:
        date_match = re.search(
            r"(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|"
            r"march|april|june|july|august|september|october|november|december|"
            r"20\d{2}|19\d{2}).*?(present|current|20\d{2}|19\d{2})",
            line, re.IGNORECASE
        )
        if date_match:
            duration = date_match.group(0).strip()
            line = line[:date_match.start()].strip(" |–-—,")

    # Split on common separators
    parts = re.split(r"\s*[|@,—–\-]\s*", line, maxsplit=1)
    role = parts[0].strip() if parts else line
    company = parts[1].strip() if len(parts) > 1 else None

    return role or None, company, duration


# ─── Education Parser ─────────────────────────────────────────────────────────

def _parse_education(text: str) -> List[EducationEntry]:
    """Parse education entries."""
    if not text:
        return []

    entries: List[EducationEntry] = []
    blocks = _split_into_blocks(text)

    for block in blocks:
        lines = split_into_lines(block)
        if not lines:
            continue

        header = lines[0]
        institution, degree, field, year = _parse_education_header(header, lines)

        # Look for GPA in block
        gpa = None
        for l in lines:
            gpa_match = _GPA_RE.search(l)
            if gpa_match:
                gpa = gpa_match.group(0)
                break

        entries.append(EducationEntry(
            institution=institution,
            degree=degree,
            field=field,
            year=year,
            gpa=gpa,
        ))

    return entries


def _parse_education_header(
    header: str, lines: List[str]
) -> Tuple[str, Optional[str], Optional[str], Optional[str]]:
    year_match = re.search(r"\b(20\d{2}|19\d{2})\b", header)
    year = year_match.group(0) if year_match else None

    # Common degree keywords
    degree_re = re.compile(
        r"\b(b\.?tech|b\.?e|b\.?sc|b\.?com|m\.?tech|m\.?sc|mba|phd|bachelor|master|"
        r"associate|diploma|be|btech|mtech|bsc)\b",
        re.IGNORECASE,
    )
    degree_match = degree_re.search(header)
    degree = degree_match.group(0) if degree_match else None

    # Field of study (often after "in" or "of")
    field_match = re.search(r"\b(?:in|of)\s+([A-Za-z\s&]+?)(?:\s*,|\s*\(|\s*-|\s*$)", header)
    field = field_match.group(1).strip() if field_match else None

    # Institution is everything before the degree or first separator
    institution = header
    if degree_match:
        institution = header[:degree_match.start()].strip(" ,-")
    if not institution and len(lines) > 1:
        institution = lines[1]

    return institution or "Unknown", degree, field, year


# ─── Projects Parser ──────────────────────────────────────────────────────────

def _parse_projects(text: str) -> List[ProjectEntry]:
    """Parse project entries."""
    if not text:
        return []

    entries: List[ProjectEntry] = []
    blocks = _split_into_blocks(text)

    for block in blocks:
        lines = split_into_lines(block)
        if not lines:
            continue

        name = lines[0].strip(" :-•*")
        desc_lines = lines[1:]
        description = " ".join(strip_bullets(l) for l in desc_lines).strip()

        # Extract technologies
        tech: List[str] = []
        tech_line_re = re.compile(r"(tech(nologies)?|stack|built with|tools?)[\s:]+(.+)", re.IGNORECASE)
        for l in desc_lines:
            m = tech_line_re.search(l)
            if m:
                tech = deduplicate_skills(split_tech_tokens(m.group(3)))
                break
        if not tech:
            tech = _extract_tech_from_description(description)

        urls = extract_urls(block)
        url = urls[0] if urls else None

        if name:
            entries.append(ProjectEntry(
                name=name[:120],
                description=description[:600] if description else None,
                technologies=tech,
                url=url,
            ))

    return entries


# ─── Certifications Parser ────────────────────────────────────────────────────

def _parse_certifications(text: str) -> List[CertificationEntry]:
    """Parse certification / award entries."""
    if not text:
        return []

    entries: List[CertificationEntry] = []
    for line in split_into_lines(text):
        line = strip_bullets(line).strip()
        if not line:
            continue

        year_match = re.search(r"\b(20\d{2}|19\d{2})\b", line)
        year = year_match.group(0) if year_match else None

        # Try to extract issuer after "by", "from", "|"
        issuer_match = re.search(r"(?:by|from|\|)\s*([A-Za-z][^\n|]{2,40})", line, re.IGNORECASE)
        issuer = issuer_match.group(1).strip() if issuer_match else None

        # Name is what's left
        name = line
        if year:
            name = re.sub(str(year), "", name).strip(" ,-")
        if issuer:
            name = re.sub(re.escape(issuer), "", name, flags=re.IGNORECASE).strip(" |-by,")

        if name:
            entries.append(CertificationEntry(
                name=name[:200],
                issuer=issuer,
                year=year,
            ))

    return entries


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _split_into_blocks(text: str) -> List[str]:
    """
    Split section text into discrete entry blocks.
    Blocks are separated by blank lines or detected by date patterns.
    """
    # Split on double newlines
    blocks = re.split(r"\n\s*\n", text)
    result = []
    for block in blocks:
        block = block.strip()
        if block:
            result.append(block)
    return result if result else [text]


# Known technology tokens (used for heuristic tech extraction)
_KNOWN_TECHS = {
    "python", "java", "javascript", "typescript", "c++", "c#", "go", "rust",
    "react", "vue", "angular", "next.js", "node.js", "express", "django",
    "fastapi", "flask", "spring", "laravel", "rails",
    "postgresql", "mysql", "mongodb", "redis", "elasticsearch", "sqlite",
    "docker", "kubernetes", "terraform", "ansible", "git", "linux",
    "aws", "gcp", "azure", "firebase", "supabase",
    "pytorch", "tensorflow", "keras", "scikit-learn", "pandas", "numpy",
    "html", "css", "tailwindcss", "bootstrap", "sass",
    "graphql", "rest", "grpc", "kafka", "rabbitmq", "celery",
    "nginx", "apache", "jenkins", "github actions", "gitlab ci",
}


def _extract_tech_from_description(text: str) -> List[str]:
    """Extract known technology tokens from free-form description text."""
    text_lower = text.lower()
    found = []
    for tech in _KNOWN_TECHS:
        # Match as whole word (handle dots in tech names like node.js)
        pattern = re.escape(tech)
        if re.search(r"\b" + pattern + r"\b", text_lower):
            found.append(tech)
    return found
