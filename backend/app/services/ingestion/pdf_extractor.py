"""Fast local PDF extraction using pdfplumber."""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Optional

import pdfplumber


@dataclass
class ClauseDraft:
    section_number: Optional[str]
    title: Optional[str]
    text: str
    page_start: int
    page_end: int


# Pattern to detect section headers like "1. Introduction" or "11.2 Liability"
_SECTION_HEADER_RE = re.compile(
    r"^(\d+(?:\.\d+)*)\s*\.?\s+([A-Z][A-Za-z\s,&\-]+?)(?:\.|$)", re.MULTILINE
)

# Pattern for titled sections without numbers like "INDEMNIFICATION"
_TITLE_HEADER_RE = re.compile(
    r"^([A-Z][A-Z\s]{2,50})(?:\.|:|\n)", re.MULTILINE
)


def extract_text_from_pdf(pdf_path: str) -> list[tuple[int, str]]:
    """Extract text from each page. Returns list of (page_number, text)."""
    pages = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            pages.append((i, text))
    return pages


def extract_clauses_fast(pdf_path: str) -> list[ClauseDraft]:
    """
    Extract clauses from PDF using local pdfplumber.
    Groups text by section headers found in the document.
    """
    pages = extract_text_from_pdf(pdf_path)

    # Combine all text with page markers
    full_text = ""
    page_offsets = []  # (start_offset, page_number)

    for page_num, text in pages:
        page_offsets.append((len(full_text), page_num))
        full_text += text + "\n\n"

    def get_page_for_offset(offset: int) -> int:
        """Find which page an offset falls on."""
        for i, (start, page_num) in enumerate(page_offsets):
            if i + 1 < len(page_offsets):
                if start <= offset < page_offsets[i + 1][0]:
                    return page_num
            else:
                return page_num
        return 1

    # Find all section headers
    sections = []

    # Find numbered sections like "1. Introduction"
    for match in _SECTION_HEADER_RE.finditer(full_text):
        sections.append({
            "start": match.start(),
            "section_number": match.group(1),
            "title": match.group(2).strip(),
        })

    # Find titled sections like "INDEMNIFICATION"
    for match in _TITLE_HEADER_RE.finditer(full_text):
        title = match.group(1).strip()
        # Skip if too short or looks like junk
        if len(title) < 4 or title in ("THE", "AND", "FOR", "THIS"):
            continue
        # Skip if we already have a numbered section near this position
        pos = match.start()
        if any(abs(s["start"] - pos) < 50 for s in sections):
            continue
        sections.append({
            "start": pos,
            "section_number": None,
            "title": title.title(),
        })

    # Sort by position
    sections.sort(key=lambda s: s["start"])

    # If no sections found, treat entire document as one clause
    if not sections:
        return [ClauseDraft(
            section_number=None,
            title=None,
            text=full_text.strip()[:10000],  # Limit size
            page_start=1,
            page_end=len(pages),
        )]

    # Build clauses from sections
    drafts = []
    for i, section in enumerate(sections):
        start = section["start"]
        # End at next section or end of document
        end = sections[i + 1]["start"] if i + 1 < len(sections) else len(full_text)

        text = full_text[start:end].strip()

        # Skip very short sections (likely junk)
        if len(text) < 50:
            continue

        # Truncate very long sections
        if len(text) > 8000:
            text = text[:8000] + "..."

        page_start = get_page_for_offset(start)
        page_end = get_page_for_offset(end - 1)

        drafts.append(ClauseDraft(
            section_number=section["section_number"],
            title=section["title"],
            text=text,
            page_start=page_start,
            page_end=page_end,
        ))

    return drafts
