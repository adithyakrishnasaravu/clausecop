from __future__ import annotations

import json

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import select

from app.db.models import Clause, Document, RiskAssessment
from app.db.session import get_session

router = APIRouter(prefix="/documents", tags=["clauses"])

clause_router = APIRouter(prefix="/clauses", tags=["clauses"])


@clause_router.get("/{clause_id}")
def get_clause(clause_id: int, session=Depends(get_session)):
    """Get a single clause by ID with its risk data."""
    c = session.exec(select(Clause).where(Clause.id == clause_id)).first()
    if not c:
        raise HTTPException(status_code=404, detail="Clause not found")

    assessment = session.exec(
        select(RiskAssessment).where(RiskAssessment.clause_id == c.id)
    ).first()

    risk = None
    if assessment:
        risk = {
            "risk_score": assessment.risk_score,
            "severity": assessment.severity,
            "signals": json.loads(assessment.signals),
            "summary": assessment.summary,
            "recommendation": assessment.recommendation,
        }

    return {
        "id": c.id,
        "document_id": c.document_id,
        "clause_index": c.clause_index,
        "section_number": c.section_number,
        "title": c.title,
        "category": c.category,
        "confidence": c.confidence,
        "page_start": c.page_start,
        "page_end": c.page_end,
        "text": c.text,
        "risk": risk,
    }


@router.get("/{document_id}/clauses")
def list_clauses(document_id: int, session=Depends(get_session)):
    """List all clauses for a document, including risk data when available."""
    clauses = session.exec(
        select(Clause)
        .where(Clause.document_id == document_id)
        .order_by(Clause.clause_index)
    ).all()

    results = []
    for c in clauses:
        assessment = session.exec(
            select(RiskAssessment).where(RiskAssessment.clause_id == c.id)
        ).first()

        entry = {
            "id": c.id,
            "clause_index": c.clause_index,
            "section_number": c.section_number,
            "title": c.title,
            "category": c.category,
            "confidence": c.confidence,
            "page_start": c.page_start,
            "page_end": c.page_end,
            "text": c.text,
            "risk": None,
        }

        if assessment:
            entry["risk"] = {
                "risk_score": assessment.risk_score,
                "severity": assessment.severity,
                "signals": json.loads(assessment.signals),
                "summary": assessment.summary,
                "recommendation": assessment.recommendation,
            }

        results.append(entry)

    return results


@router.get("/{document_id}/risk-summary")
def risk_summary(document_id: int, session=Depends(get_session)):
    """Document-level risk profile: overall score, severity distribution, top risks, safe clauses."""
    doc = session.exec(select(Document).where(Document.id == document_id)).first()
    clauses = session.exec(
        select(Clause)
        .where(Clause.document_id == document_id)
        .order_by(Clause.clause_index)
    ).all()

    if not clauses:
        return {"error": "No clauses found for this document."}

    assessments: list[dict] = []
    for c in clauses:
        a = session.exec(
            select(RiskAssessment).where(RiskAssessment.clause_id == c.id)
        ).first()
        if a:
            assessments.append({
                "clause_id": c.id,
                "clause_index": c.clause_index,
                "section_number": c.section_number,
                "title": c.title,
                "category": a.category,
                "risk_score": a.risk_score,
                "severity": a.severity,
                "summary": a.summary,
                "recommendation": a.recommendation,
            })

    if not assessments:
        return {"error": "No risk assessments found. Document may still be processing."}

    scores = [a["risk_score"] for a in assessments]
    overall_score = round(sum(scores) / len(scores), 1)

    severity_dist = {"low": 0, "medium": 0, "high": 0, "critical": 0}
    for a in assessments:
        severity_dist[a["severity"]] = severity_dist.get(a["severity"], 0) + 1

    # Overall severity from overall score
    if overall_score <= 25:
        overall_severity = "low"
    elif overall_score <= 50:
        overall_severity = "medium"
    elif overall_score <= 75:
        overall_severity = "high"
    else:
        overall_severity = "critical"

    top_risks = sorted(assessments, key=lambda x: x["risk_score"], reverse=True)[:5]

    safe_clauses = sorted(assessments, key=lambda x: x["risk_score"])[:3]
    safe_clauses = [a for a in safe_clauses if a["severity"] == "low"]

    return {
        "document_id": document_id,
        "filename": doc.filename if doc else None,
        "total_clauses": len(clauses),
        "assessed_clauses": len(assessments),
        "overall_score": overall_score,
        "overall_severity": overall_severity,
        "severity_distribution": severity_dist,
        "top_risks": top_risks,
        "safe_clauses": safe_clauses,
    }
