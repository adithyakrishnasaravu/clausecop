from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.services.retrieval.pinecone_index import query_similar
from app.services.retrieval.qa import ask

router = APIRouter(prefix="/qa", tags=["qa"])


class AskRequest(BaseModel):
    question: str
    document_id: Optional[int] = None
    project_id: Optional[int] = None
    top_k: int = 5


@router.post("/ask")
def ask_question(body: AskRequest):
    """Ask a question about contract clauses using RAG."""
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    result = ask(
        question=body.question,
        document_id=body.document_id,
        project_id=body.project_id,
        top_k=body.top_k,
    )
    return result


@router.get("/search")
def search_clauses(
    q: str = Query(..., min_length=1, description="Search text"),
    top_k: int = Query(5, ge=1, le=20),
    category: Optional[str] = Query(None),
    document_id: Optional[int] = Query(None),
    project_id: Optional[int] = Query(None),
):
    """Semantic search for similar clauses across all documents."""
    matches = query_similar(
        text=q,
        top_k=top_k,
        category_filter=category,
        document_id_filter=document_id,
        project_id_filter=project_id,
    )
    return {"query": q, "results": matches}
