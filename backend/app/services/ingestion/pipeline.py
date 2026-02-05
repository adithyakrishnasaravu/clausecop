from __future__ import annotations

import json
import logging

from sqlmodel import Session, select

from app.db.models import Clause, Document, RiskAssessment
from app.services.ingestion.unstructured_client import partition_pdf
from app.services.ingestion.unstructured_to_clauses import build_clause_drafts
from app.services.llm.client import analyze_risk, classify_clause
from app.services.retrieval.pinecone_index import delete_by_document, upsert_clause
from app.services.risk.scorer import compute_risk_score

log = logging.getLogger(__name__)


def _assess_clause(clause: Clause, session: Session, project_id: int | None = None) -> None:
    """Classify a clause, analyse its risk, score it, and persist."""
    # Step 1 — classify
    classification = classify_clause(clause.text)
    clause.category = classification.category
    clause.confidence = classification.confidence
    session.add(clause)

    # Step 2 — risk signals
    analysis = analyze_risk(clause.text, classification.category)

    # Step 3 — numeric score
    signals_dict = analysis.signals.to_dict()
    score, severity = compute_risk_score(classification.category, signals_dict)

    # Step 4 — persist risk assessment
    assessment = RiskAssessment(
        clause_id=clause.id,
        category=classification.category,
        risk_score=score,
        severity=severity,
        signals=json.dumps(signals_dict),
        summary=analysis.summary,
        recommendation=analysis.recommendation,
        assessed_by=f"openai/{classification.category}",
    )
    session.add(assessment)

    # Step 5 — embed and upsert to Pinecone
    try:
        upsert_clause(
            clause_id=clause.id,
            document_id=clause.document_id,
            text=clause.text,
            category=classification.category,
            risk_score=score,
            severity=severity,
            project_id=project_id,
        )
    except Exception:
        log.exception("Pinecone upsert failed for clause %s (non-blocking)", clause.id)


def process_doc(doc_id: int, session: Session) -> None:
    """
    Process a document end-to-end:
    1. Parse PDF via Unstructured
    2. Convert to ClauseDrafts
    3. Store Clauses in DB
    4. Classify each clause and run risk analysis
    5. Update document status
    """
    document = session.exec(select(Document).where(Document.id == doc_id)).first()
    if not document:
        raise ValueError(f"Document {doc_id} not found")

    try:
        # Make re-runs idempotent during dev — clear old clauses + assessments + vectors
        try:
            delete_by_document(doc_id)
        except Exception:
            log.exception("Pinecone cleanup failed for document %d (non-blocking)", doc_id)

        existing = session.exec(select(Clause).where(Clause.document_id == doc_id)).all()
        for c in existing:
            old_assessment = session.exec(
                select(RiskAssessment).where(RiskAssessment.clause_id == c.id)
            ).first()
            if old_assessment:
                session.delete(old_assessment)
            session.delete(c)
        session.commit()

        # --- Extraction ---
        elements = partition_pdf(document.file_path, coordinates=False)
        clause_drafts = build_clause_drafts(elements)

        clauses: list[Clause] = []
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
            clauses.append(clause)

        # Flush so clauses get IDs assigned
        session.flush()

        # --- Risk Analysis ---
        for clause in clauses:
            try:
                _assess_clause(clause, session, project_id=document.project_id)
            except Exception:
                log.exception("Risk analysis failed for clause %s", clause.id)
                # Continue with remaining clauses — don't block the whole doc

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
