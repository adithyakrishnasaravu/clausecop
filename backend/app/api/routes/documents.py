# goal
# Accept upload input (the outside world)
# Persist it (so it doesn’t disappear)
# Create a DB record (so the rest of your system can reference it)

from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlmodel import Session

from app.core.config import settings
from app.db.models import Document
from app.db.session import get_session
from app.services.ingestion.pipeline import process_doc
router = APIRouter(prefix="/documents", tags=["documents"])

# Upload Endpoint
@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
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
    )
    session.add(document) #ingestion
    session.commit()
    session.refresh(document)

    process_doc(document.id, session) # clause extraction
    session.refresh(document)

    return {"document_id": document.id, "status": document.status} # Return document ID and status
