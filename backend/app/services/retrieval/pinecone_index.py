"""Pinecone vector index for clause embeddings.

Responsibilities:
- Generate embeddings via OpenAI text-embedding-3-small
- Upsert clause vectors into Pinecone
- Query similar clauses by text or vector
"""
from __future__ import annotations

import logging
from typing import Any

from openai import OpenAI
from pinecone import Pinecone

from app.core.config import settings

log = logging.getLogger(__name__)

_pc: Pinecone | None = None
_index = None
_openai: OpenAI | None = None


def _get_openai() -> OpenAI:
    global _openai
    if _openai is None:
        _openai = OpenAI(api_key=settings.openai_api_key)
    return _openai


def _get_index():
    global _pc, _index
    if _index is None:
        _pc = Pinecone(api_key=settings.pinecone_api_key)
        _index = _pc.Index(settings.pinecone_index_name)
    return _index


def generate_embedding(text: str) -> list[float]:
    """Generate an embedding vector for a text string."""
    response = _get_openai().embeddings.create(
        model=settings.openai_embedding_model,
        input=text,
    )
    return response.data[0].embedding


def upsert_clause(
    clause_id: int,
    document_id: int,
    text: str,
    category: str,
    risk_score: float | None = None,
    severity: str | None = None,
    project_id: int | None = None,
) -> None:
    """Generate embedding for a clause and upsert it into Pinecone."""
    embedding = generate_embedding(text)
    metadata = {
        "clause_id": clause_id,
        "document_id": document_id,
        "category": category,
        "text": text[:1000],  # Pinecone metadata limit
    }
    if project_id is not None:
        metadata["project_id"] = project_id
    if risk_score is not None:
        metadata["risk_score"] = risk_score
    if severity is not None:
        metadata["severity"] = severity

    _get_index().upsert(
        vectors=[
            {
                "id": f"clause-{clause_id}",
                "values": embedding,
                "metadata": metadata,
            }
        ],
        namespace=settings.pinecone_namespace,
    )
    log.info("Upserted clause %d to Pinecone", clause_id)


def query_similar(
    text: str,
    top_k: int = 5,
    category_filter: str | None = None,
    document_id_filter: int | None = None,
    project_id_filter: int | None = None,
) -> list[dict[str, Any]]:
    """Find clauses similar to the given text.

    Returns list of dicts with keys: clause_id, score, category, text, document_id, project_id, risk_score, severity
    """
    embedding = generate_embedding(text)

    filter_dict: dict[str, Any] = {}
    if category_filter:
        filter_dict["category"] = {"$eq": category_filter}
    if document_id_filter is not None:
        filter_dict["document_id"] = {"$eq": document_id_filter}
    if project_id_filter is not None:
        filter_dict["project_id"] = {"$eq": project_id_filter}

    results = _get_index().query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True,
        namespace=settings.pinecone_namespace,
        filter=filter_dict if filter_dict else None,
    )

    matches = []
    for match in results.get("matches", []):
        meta = match.get("metadata", {})
        matches.append({
            "clause_id": meta.get("clause_id"),
            "document_id": meta.get("document_id"),
            "project_id": meta.get("project_id"),
            "score": match.get("score"),
            "category": meta.get("category"),
            "text": meta.get("text"),
            "risk_score": meta.get("risk_score"),
            "severity": meta.get("severity"),
        })

    return matches


def delete_by_document(document_id: int) -> None:
    """Delete all clause vectors for a given document."""
    # Pinecone requires IDs for deletion; query first to find them
    # Use a dummy vector to list by metadata filter
    try:
        _get_index().delete(
            filter={"document_id": {"$eq": document_id}},
            namespace=settings.pinecone_namespace,
        )
        log.info("Deleted Pinecone vectors for document %d", document_id)
    except Exception:
        log.exception("Failed to delete Pinecone vectors for document %d", document_id)
