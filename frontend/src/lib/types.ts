export interface RiskSignals {
  one_sided: boolean;
  uncapped_liability: boolean;
  broad_indemnity: boolean;
  short_cure_period: boolean;
  auto_renewal: boolean;
  non_standard: boolean;
  missing_mutual: boolean;
  unlimited_ip: boolean;
  weak_termination: boolean;
  vague_language: boolean;
  weak_sla: boolean;
  poor_data_terms: boolean;
}

export interface RiskData {
  risk_score: number;
  severity: "low" | "medium" | "high" | "critical";
  signals: RiskSignals;
  summary: string;
  recommendation: string;
}

export interface Clause {
  id: number;
  clause_index: number;
  section_number: string | null;
  title: string | null;
  category: string;
  confidence: number | null;
  page_start: number;
  page_end: number;
  text: string;
  risk: RiskData | null;
}

export interface TopRisk {
  clause_id: number;
  clause_index: number;
  section_number: string | null;
  title: string | null;
  category: string;
  risk_score: number;
  severity: string;
  summary: string;
  recommendation: string;
}

export interface RiskSummary {
  document_id: number;
  filename: string | null;
  display_name: string | null;
  total_clauses: number;
  assessed_clauses: number;
  overall_score: number;
  overall_severity: "low" | "medium" | "high" | "critical";
  severity_distribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
  top_risks: TopRisk[];
  safe_clauses: TopRisk[];
}

export interface DocumentInfo {
  id: number;
  filename: string;
  display_name: string | null;
  status: string;
  num_pages: number | null;
  project_id: number | null;
  total_clauses: number | null;
  clauses_done: number | null;
}

export interface Project {
  id: number;
  name: string;
  created_at: string;
  document_count: number;
}

export interface ProjectDetail {
  id: number;
  name: string;
  created_at: string;
  documents: DocumentInfo[];
}

export interface SearchResult {
  clause_id: number;
  document_id: number;
  project_id: number | null;
  score: number;
  category: string;
  text: string;
  risk_score: number | null;
  severity: string | null;
}

export interface QAResponse {
  answer: string;
  sources: SearchResult[];
}

export interface ClauseDetail extends Clause {
  document_id: number;
}

export interface UploadResponse {
  document_id: number;
  status: string;
}

export type Severity = "low" | "medium" | "high" | "critical";
