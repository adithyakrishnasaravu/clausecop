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
  status: string;
  num_pages: number | null;
}

export interface ClauseDetail extends Clause {
  document_id: number;
}

export interface UploadResponse {
  document_id: number;
  status: string;
}

export type Severity = "low" | "medium" | "high" | "critical";
