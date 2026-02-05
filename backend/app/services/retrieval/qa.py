"""RAG-based Q&A over contract clauses.

Uses Pinecone to retrieve relevant clauses, then feeds them
as context to an LLM for grounded answers.
"""
from __future__ import annotations

import logging

from openai import OpenAI

from app.core.config import settings
from app.services.retrieval.pinecone_index import query_similar

log = logging.getLogger(__name__)

_client: OpenAI | None = None

QA_SYSTEM_PROMPT = """\
You are ClauseCop's contract analysis assistant. You answer questions about \
contract clauses using ONLY the provided context. Each context chunk is a \
clause from a contract with its category, risk score, and severity.

Rules:
- Answer based strictly on the provided clauses. Do not make up information.
- Reference specific clauses by their category and quote relevant language.
- If the context does not contain enough information, say so clearly.
- Be concise and actionable. Focus on risk implications and recommendations.
- Format your response in markdown for readability.
"""


def _get_client() -> OpenAI:
    global _client
    if _client is None:
        _client = OpenAI(api_key=settings.openai_api_key)
    return _client


def _build_context(matches: list[dict]) -> str:
    """Format retrieved clauses into a context block for the LLM."""
    chunks = []
    for i, m in enumerate(matches, 1):
        severity = m.get("severity", "unknown")
        score = m.get("risk_score", "N/A")
        category = m.get("category", "unknown")
        text = m.get("text", "")
        chunks.append(
            f"[Clause {i}] Category: {category} | Risk: {score} | Severity: {severity}\n{text}"
        )
    return "\n\n---\n\n".join(chunks)


def ask(
    question: str,
    document_id: int | None = None,
    project_id: int | None = None,
    top_k: int = 5,
) -> dict:
    """Answer a question using RAG over the clause index.

    Returns dict with keys: answer, sources (list of clause matches used).
    """
    matches = query_similar(
        text=question,
        top_k=top_k,
        document_id_filter=document_id,
        project_id_filter=project_id,
    )

    if not matches:
        return {
            "answer": "No relevant clauses found to answer this question.",
            "sources": [],
        }

    context = _build_context(matches)
    user_msg = f"Context:\n{context}\n\nQuestion: {question}"

    response = _get_client().chat.completions.create(
        model=settings.openai_model_qa,
        messages=[
            {"role": "system", "content": QA_SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        temperature=0.1,
    )

    answer = response.choices[0].message.content.strip()

    return {
        "answer": answer,
        "sources": [
            {
                "clause_id": m.get("clause_id"),
                "document_id": m.get("document_id"),
                "category": m.get("category"),
                "score": m.get("score"),
                "risk_score": m.get("risk_score"),
                "severity": m.get("severity"),
            }
            for m in matches
        ],
    }
