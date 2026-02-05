from __future__ import annotations

import json
import logging
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import Optional

from sqlmodel import Session, select, text

from app.db.models import Clause, Document, RiskAssessment
from app.services.ingestion.unstructured_client import partition_pdf
from app.services.ingestion.unstructured_to_clauses import build_clause_drafts
from app.services.llm.client import analyze_risk, classify_clause
from app.services.retrieval.pinecone_index import (
    delete_by_document,
    generate_embeddings_batch,
    upsert_clauses_batch,
)
from app.services.risk.scorer import compute_risk_score

log = logging.getLogger(__name__)

_progress_lock = threading.Lock()


def _update_progress(doc_id: int, clauses_done: int) -> None:
    """Write progress using raw SQL to avoid session conflicts."""
    from app.db.session import engine

    max_retries = 5
    for attempt in range(max_retries):
        try:
            with _progress_lock:
                with engine.connect() as conn:
                    conn.execute(
                        text("UPDATE document SET clauses_done = :done WHERE id = :id"),
                        {"done": clauses_done, "id": doc_id}
                    )
                    conn.commit()
            return
        except Exception as e:
            if attempt < max_retries - 1:
                time.sleep(0.2 * (attempt + 1))
            else:
                log.warning("Progress update failed for doc %d: %s", doc_id, e)


@dataclass
class _ClauseAnalysis:
    """Pure data holder for per-clause analysis results (no DB interaction)."""
    clause_id: int
    category: str
    confidence: float
    risk_score: float
    severity: str
    signals_dict: dict
    summary: str
    recommendation: str
    assessed_by: str
    text: str
    document_id: int
    project_id: Optional[int]


def _analyze_clause_pure(
    clause_id: int,
    text: str,
    document_id: int,
    project_id: int | None,
) -> _ClauseAnalysis:
    """Run classify + risk analysis + scoring. Pure function — no DB interaction."""
    classification = classify_clause(text)
    analysis = analyze_risk(text, classification.category)
    signals_dict = analysis.signals.to_dict()
    score, severity = compute_risk_score(classification.category, signals_dict)
    return _ClauseAnalysis(
        clause_id=clause_id,
        category=classification.category,
        confidence=classification.confidence,
        risk_score=score,
        severity=severity,
        signals_dict=signals_dict,
        summary=analysis.summary,
        recommendation=analysis.recommendation,
        assessed_by=f"openai/{classification.category}",
        text=text,
        document_id=document_id,
        project_id=project_id,
    )


def process_doc_background(doc_id: int) -> None:
    """Wrapper that creates its own DB session for use in background tasks."""
    from app.db.session import engine

    with Session(engine) as session:
        process_doc(doc_id, session)


def process_doc(doc_id: int, session: Session) -> None:
    """
    Process a document end-to-end:
    1. Parse PDF via Unstructured
    2. Convert to ClauseDrafts
    3. Store Clauses in DB
    4. Classify each clause and run risk analysis (parallel)
    5. Batch embed and upsert to Pinecone
    6. Update document status
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

        # Set progress tracking fields
        document.total_clauses = len(clauses)
        document.clauses_done = 0
        session.add(document)
        session.commit()

        # --- Phase 1: Parallel Risk Analysis ---
        analyses: list[_ClauseAnalysis] = []
        done_count = 0

        def _worker(clause: Clause) -> _ClauseAnalysis | None:
            nonlocal done_count
            try:
                result = _analyze_clause_pure(
                    clause_id=clause.id,
                    text=clause.text,
                    document_id=clause.document_id,
                    project_id=document.project_id,
                )
                return result
            except Exception:
                log.exception("Risk analysis failed for clause %s", clause.id)
                return None

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {executor.submit(_worker, c): c for c in clauses}
            for future in as_completed(futures):
                result = future.result()
                if result is not None:
                    analyses.append(result)
                done_count += 1
                # Update progress every 3 clauses or at the end to reduce DB writes
                if done_count % 3 == 0 or done_count == len(clauses):
                    _update_progress(doc_id, done_count)

        # --- Persist all clause updates + RiskAssessments in one commit ---
        # Re-fetch clauses in current session to update them
        clause_map = {c.id: c for c in clauses}
        for analysis in analyses:
            clause = clause_map.get(analysis.clause_id)
            if clause:
                clause.category = analysis.category
                clause.confidence = analysis.confidence
                session.add(clause)

            assessment = RiskAssessment(
                clause_id=analysis.clause_id,
                category=analysis.category,
                risk_score=analysis.risk_score,
                severity=analysis.severity,
                signals=json.dumps(analysis.signals_dict),
                summary=analysis.summary,
                recommendation=analysis.recommendation,
                assessed_by=analysis.assessed_by,
            )
            session.add(assessment)

        session.commit()

        # --- Phase 2: Batch embed and upsert to Pinecone ---
        try:
            texts = [a.text for a in analyses]
            embeddings = generate_embeddings_batch(texts)

            batch_data = []
            for analysis, embedding in zip(analyses, embeddings):
                batch_data.append({
                    "clause_id": analysis.clause_id,
                    "document_id": analysis.document_id,
                    "text": analysis.text,
                    "category": analysis.category,
                    "risk_score": analysis.risk_score,
                    "severity": analysis.severity,
                    "project_id": analysis.project_id,
                    "embedding": embedding,
                })

            upsert_clauses_batch(batch_data)
        except Exception:
            log.exception("Batch Pinecone upsert failed for document %d (non-blocking)", doc_id)

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
