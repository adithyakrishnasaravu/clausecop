from __future__ import annotations
from fastapi import Depends
from sqlmodel import select

from app.db.models import Clause
from app.db.session import get_session

from fastapi import APIRouter

router = APIRouter(prefix="/documents", tags=["clauses"])

@router.get("/{document_id}/clauses")
def list_clauses(document_id: int, session=Depends(get_session)):
    """
    List all clauses for a given document.
    """
    clauses = session.exec(select(Clause).where(Clause.document_id == document_id).order_by(Clause.clause_index)).all()
    return [
        {
            "id": c.id,
            "clause_index": c.clause_index,
            "section_number": c.section_number,
            "title": c.title,
            "category": c.category,
            "confidence": c.confidence,
            "page_start": c.page_start,
            "page_end": c.page_end,
            "text": c.text,
        }
        for c in clauses
    ]