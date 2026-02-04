import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Clause, RiskSummary } from "./types";

export function generatePDFReport(summary: RiskSummary, clauses: Clause[]) {
  const doc = new jsPDF();
  const filename =
    summary.display_name ?? summary.filename?.replace(/\.pdf$/i, "") ?? `Document #${summary.document_id}`;

  // Title
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("ClauseCop Risk Analysis Report", 14, 22);

  // Document info
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Document: ${filename}`, 14, 34);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 41);
  doc.text(
    `Clauses Analyzed: ${summary.assessed_clauses} / ${summary.total_clauses}`,
    14,
    48
  );

  // Overall score
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Overall Risk", 14, 62);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(
    `Score: ${summary.overall_score} / 100   |   Severity: ${summary.overall_severity.toUpperCase()}`,
    14,
    70
  );

  // Severity distribution table
  let y = 80;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Severity Distribution", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["Severity", "Count"]],
    body: [
      ["Critical", String(summary.severity_distribution.critical)],
      ["High", String(summary.severity_distribution.high)],
      ["Medium", String(summary.severity_distribution.medium)],
      ["Low", String(summary.severity_distribution.low)],
    ],
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14 },
    tableWidth: 80,
  });

  // Top risks table
  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y += 12;

  if (summary.top_risks.length > 0) {
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Top Risks", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["#", "Section", "Category", "Score", "Severity", "Summary"]],
      body: summary.top_risks.map((r) => [
        String(r.clause_index + 1),
        r.section_number ?? "—",
        r.category.replace(/_/g, " "),
        String(r.risk_score),
        r.severity,
        r.summary.slice(0, 80) + (r.summary.length > 80 ? "..." : ""),
      ]),
      theme: "grid",
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
      columnStyles: { 5: { cellWidth: 60 } },
    });
  }

  // Safe clauses table
  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y += 12;

  if (summary.safe_clauses.length > 0) {
    if (y > 250) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Safe Clauses", 14, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      head: [["#", "Section", "Category", "Score"]],
      body: summary.safe_clauses.map((c) => [
        String(c.clause_index + 1),
        c.section_number ?? "—",
        c.category.replace(/_/g, " "),
        String(c.risk_score),
      ]),
      theme: "grid",
      headStyles: { fillColor: [66, 66, 66] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 },
    });
  }

  // All clauses table
  y = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;
  y += 12;

  if (y > 250) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("All Clauses", 14, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    head: [["#", "Section", "Title", "Category", "Score", "Severity"]],
    body: clauses.map((c) => [
      String(c.clause_index + 1),
      c.section_number ?? "—",
      (c.title ?? "Untitled").slice(0, 40),
      c.category.replace(/_/g, " "),
      String(c.risk?.risk_score ?? "—"),
      c.risk?.severity ?? "—",
    ]),
    theme: "grid",
    headStyles: { fillColor: [66, 66, 66] },
    margin: { left: 14, right: 14 },
    styles: { fontSize: 8 },
  });

  doc.save(`${filename}_risk_analysis.pdf`);
}
