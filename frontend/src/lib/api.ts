import type { Clause, ClauseDetail, DocumentInfo, Project, ProjectDetail, QAResponse, RiskSummary, SearchResult, UploadResponse } from "./types";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export async function uploadDocument(file: File, projectId?: number): Promise<UploadResponse> {
  const form = new FormData();
  form.append("file", file);
  if (projectId != null) {
    form.append("project_id", String(projectId));
  }

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

export async function fetchDocument(documentId: number): Promise<DocumentInfo & { error_message?: string }> {
  const res = await fetch(`${BASE_URL}/documents/${documentId}`);
  if (!res.ok) throw new Error("Failed to fetch document");
  return res.json();
}

export async function renameDocument(documentId: number, displayName: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/documents/${documentId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ display_name: displayName }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Rename failed");
  }
}

export async function deleteDocument(documentId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/documents/${documentId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Delete failed");
  }
}

// --- Projects ---

export async function createProject(name: string): Promise<Project> {
  const res = await fetch(`${BASE_URL}/projects/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Failed to create project");
  }
  return res.json();
}

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${BASE_URL}/projects/`);
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
}

export async function fetchProject(projectId: number): Promise<ProjectDetail> {
  const res = await fetch(`${BASE_URL}/projects/${projectId}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

export async function renameProject(projectId: number, name: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/projects/${projectId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Rename failed");
  }
}

export async function deleteProject(projectId: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/projects/${projectId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Delete failed");
  }
}

// --- Search & Q&A ---

export async function searchClauses(
  q: string,
  opts?: { project_id?: number; document_id?: number; top_k?: number }
): Promise<{ query: string; results: SearchResult[] }> {
  const params = new URLSearchParams({ q });
  if (opts?.project_id != null) params.set("project_id", String(opts.project_id));
  if (opts?.document_id != null) params.set("document_id", String(opts.document_id));
  if (opts?.top_k != null) params.set("top_k", String(opts.top_k));

  const res = await fetch(`${BASE_URL}/qa/search?${params}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function askQuestion(
  question: string,
  opts?: { project_id?: number; document_id?: number; top_k?: number }
): Promise<QAResponse> {
  const res = await fetch(`${BASE_URL}/qa/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      project_id: opts?.project_id ?? null,
      document_id: opts?.document_id ?? null,
      top_k: opts?.top_k ?? 5,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Q&A failed");
  }
  return res.json();
}
