# goal
# Accept upload input (the outside world)
# Persist it (so it doesn’t disappear)
# Create a DB record (so the rest of your system can reference it)

from __future__ import annotations

import os
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Body, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session

from sqlmodel import select

from app.core.config import settings
from app.db.models import Clause, Document, RiskAssessment
from app.db.session import get_session
from app.services.ingestion.pipeline import process_doc
from app.services.retrieval.pinecone_index import delete_by_document

router = APIRouter(prefix="/documents", tags=["documents"])


@router.get("/")
def list_documents(session: Session = Depends(get_session)):
    """List all uploaded documents."""
    docs = session.exec(select(Document).order_by(Document.id.desc())).all()
    return [
        {
            "id": d.id,
            "project_id": d.project_id,
            "filename": d.filename,
            "display_name": d.display_name,
            "status": d.status,
            "num_pages": d.num_pages,
        }
        for d in docs
    ]

# Upload Endpoint
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    project_id: Optional[int] = Form(default=None),
    session: Session = Depends(get_session),
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename or "document.pdf").suffix or ".pdf"
    filename = f"{uuid4().hex}{suffix}"
    destination = upload_dir / filename

    contents = await file.read()
    destination.write_bytes(contents)

    document = Document(
        filename=file.filename or filename,
        status="processing",
        file_path=str(destination),
        project_id=project_id,
    )
    session.add(document) #ingestion
    session.commit()
    session.refresh(document)

    process_doc(document.id, session)
    session.refresh(document)

    return {"document_id": document.id, "status": document.status}


@router.get("/{document_id}")
def get_document(document_id: int, session: Session = Depends(get_session)):
    """Get a single document's metadata."""
    doc = session.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return {
        "id": doc.id,
        "filename": doc.filename,
        "display_name": doc.display_name,
        "status": doc.status,
        "num_pages": doc.num_pages,
        "error_message": doc.error_message,
    }


@router.delete("/{document_id}")
def delete_document(document_id: int, session: Session = Depends(get_session)):
    """Delete a document and all associated data."""
    doc = session.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Clean up Pinecone vectors
    try:
        delete_by_document(document_id)
    except Exception:
        pass  # non-blocking

    # Delete risk assessments for all clauses of this document
    clauses = session.exec(
        select(Clause).where(Clause.document_id == document_id)
    ).all()
    clause_ids = [c.id for c in clauses]
    if clause_ids:
        risks = session.exec(
            select(RiskAssessment).where(RiskAssessment.clause_id.in_(clause_ids))
        ).all()
        for r in risks:
            session.delete(r)

    # Delete clauses
    for c in clauses:
        session.delete(c)

    # Delete physical file
    if doc.file_path and os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    # Delete document record
    session.delete(doc)
    session.commit()

    return {"ok": True}


@router.patch("/{document_id}")
def rename_document(
    document_id: int,
    display_name: str = Body(..., embed=True),
    session: Session = Depends(get_session),
):
    """Update a document's display name."""
    doc = session.get(Document, document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc.display_name = display_name or None
    session.add(doc)
    session.commit()
    session.refresh(doc)
    return {
        "id": doc.id,
        "filename": doc.filename,
        "display_name": doc.display_name,
        "status": doc.status,
        "num_pages": doc.num_pages,
    }
