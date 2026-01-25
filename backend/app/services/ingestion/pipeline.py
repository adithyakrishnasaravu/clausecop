from __future__ import annotations

from sqlmodel import Session, select

from app.db.models import Clause, Document
from app.services.ingestion.unstructured_client import partition_pdf
from app.services.ingestion.unstructured_to_clauses import build_clause_drafts


def process_doc(doc_id: int, session: Session) -> None:
    """
    Process a document:
    - Parse PDF via Unstructured
    - Convert to ClauseDrafts
    - Store Clauses in DB
    - Update document status
    """
    document = session.exec(select(Document).where(Document.id == doc_id)).first()
    if not document:
        raise ValueError(f"Document {doc_id} not found")

    try:
        # Make re-runs idempotent during dev
        existing = session.exec(select(Clause).where(Clause.document_id == doc_id)).all()
        for c in existing:
            session.delete(c)
        session.commit()

        elements = partition_pdf(document.file_path, coordinates=False)
        clause_drafts = build_clause_drafts(elements)

        for index, draft in enumerate(clause_drafts):
            clause = Clause(
                document_id=document.id,
                clause_index=index,
                section_number=draft.section_number,
                title=draft.title,
                page_start=draft.page_start,
                page_end=draft.page_end,
                text=draft.text,
                category="Other",
                confidence=None,
            )
            session.add(clause)

        document.status = "ready"
        session.add(document)
        session.commit()

    except Exception as e:
        document.status = "failed"
        if hasattr(document, "error_message"):
            document.error_message = str(e)[:500]
        session.add(document)
        session.commit()
        raise
