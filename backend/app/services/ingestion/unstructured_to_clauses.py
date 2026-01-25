from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class ClauseDraft:
    section_number: Optional[str]
    title: Optional[str]
    text: str
    page_start: int
    page_end: int


_SECTION_RE = re.compile(r"^\s*(\d+(?:\.\d+)*)\.?\s*(.*)\s*$")


def parse_section_and_title(header: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Examples:
      '11. Indemnification' -> ('11', 'Indemnification')
      '12 Intellectual Property Indemnification' -> ('12', 'Intellectual Property Indemnification')
      'Governing Law' -> (None, 'Governing Law')
    """
    h = (header or "").strip()
    m = _SECTION_RE.match(h)
    if not m:
        return None, (h if h else None)
    sec = m.group(1)
    ttl = m.group(2).strip() or None
    return sec, ttl


def build_clause_drafts(elements: List[Dict[str, Any]]) -> List[ClauseDraft]:
    """
    Build clauses from Unstructured elements using:
    - Title as clause header
    - NarrativeText (and similar) grouped via parent_id
    - page_number metadata for page range
    """
    # Map element_id -> element
    by_id: Dict[str, Dict[str, Any]] = {}
    titles: List[Dict[str, Any]] = []
    children_by_parent: Dict[str, List[Dict[str, Any]]] = {}

    for el in elements:
        eid = el.get("element_id")
        if eid:
            by_id[eid] = el

        el_type = (el.get("type") or "").lower()
        meta = el.get("metadata") or {}
        parent_id = meta.get("parent_id")

        if el_type == "title":
            titles.append(el)

        if parent_id:
            children_by_parent.setdefault(parent_id, []).append(el)

    drafts: List[ClauseDraft] = []

    # Preserve the original order by iterating over titles in element order
    for title_el in titles:
        header = (title_el.get("text") or "").strip()
        title_meta = title_el.get("metadata") or {}
        title_page = int(title_meta.get("page_number") or 1)

        section_number, title_text = parse_section_and_title(header)

        # Gather children (body elements) that belong to this title
        eid = title_el.get("element_id")
        kids = children_by_parent.get(eid, [])

        body_parts: List[str] = []
        pages = [title_page]

        for kid in kids:
            kid_text = (kid.get("text") or "").strip()
            if kid_text:
                body_parts.append(kid_text)
            kid_meta = kid.get("metadata") or {}
            if kid_meta.get("page_number"):
                pages.append(int(kid_meta["page_number"]))

        # If there is no body, still keep the title as a clause (rare but ok)
        full_text = header
        if body_parts:
            full_text = header + "\n" + "\n".join(body_parts)

        page_start = min(pages) if pages else title_page
        page_end = max(pages) if pages else title_page

        # Skip extremely short junk
        if len(full_text.strip()) < 40:
            continue

        drafts.append(
            ClauseDraft(
                section_number=section_number,
                title=title_text,
                text=full_text.strip(),
                page_start=page_start,
                page_end=page_end,
            )
        )

    return drafts