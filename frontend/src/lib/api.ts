import type { Clause, ClauseDetail, DocumentInfo, RiskSummary, UploadResponse } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE_URL}/documents/upload`, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Upload failed");
  }

  return res.json();
}

export async function fetchDocuments(): Promise<DocumentInfo[]> {
  const res = await fetch(`${BASE_URL}/documents/`);
  if (!res.ok) throw new Error("Failed to fetch documents");
  return res.json();
}

export async function fetchClauses(documentId: number): Promise<Clause[]> {
  const res = await fetch(`${BASE_URL}/documents/${documentId}/clauses`);
  if (!res.ok) throw new Error("Failed to fetch clauses");
  return res.json();
}

export async function fetchClause(clauseId: number): Promise<ClauseDetail> {
  const res = await fetch(`${BASE_URL}/clauses/${clauseId}`);
  if (!res.ok) throw new Error("Failed to fetch clause");
  return res.json();
}

export async function fetchRiskSummary(
  documentId: number
): Promise<RiskSummary> {
  const res = await fetch(`${BASE_URL}/documents/${documentId}/risk-summary`);
  if (!res.ok) throw new Error("Failed to fetch risk summary");
  return res.json();
}
