import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import RiskSummaryCard from "../components/RiskSummary";
import ClauseTable from "../components/ClauseTable";
import Filters from "../components/Filters";
import { fetchClauses, fetchRiskSummary } from "../lib/api";
import type { Clause, RiskSummary } from "../lib/types";
import { severityColor } from "../theme";

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [clauses, setClauses] = useState<Clause[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [severity, setSeverity] = useState<string | null>(null);
  const [category, setCategory] = useState("");

  useEffect(() => {
    if (!id) return;
    const docId = Number(id);
    setLoading(true);
    Promise.all([fetchClauses(docId), fetchRiskSummary(docId)])
      .then(([c, s]) => {
        setClauses(c);
        setSummary(s);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const categories = useMemo(
    () => [...new Set(clauses.map((c) => c.category))].sort(),
    [clauses]
  );

  const filtered = useMemo(() => {
    let result = clauses;
    if (severity) {
      result = result.filter((c) => c.risk?.severity === severity);
    }
    if (category) {
      result = result.filter((c) => c.category === category);
    }
    return result;
  }, [clauses, severity, category]);

  const needsAttention = useMemo(() => {
    if (!summary) return 0;
    return summary.severity_distribution.high + summary.severity_distribution.critical;
  }, [summary]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={300} height={48} />
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 2, my: 2 }}>
          <Skeleton variant="rounded" height={220} />
          <Skeleton variant="rounded" height={220} />
          <Skeleton variant="rounded" height={220} />
        </Box>
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  if (error || (!loading && !summary)) {
    return (
      <Box sx={{ textAlign: "center", mt: 8 }}>
        <Typography variant="h6" gutterBottom>
          This document did not load correctly.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please try uploading the contract again.
        </Typography>
        <Button variant="outlined" onClick={() => navigate("/")}>
          Go to upload
        </Button>
      </Box>
    );
  }

  const docName = summary?.filename?.replace(/\.pdf$/i, "") ?? `Document #${id}`;

  return (
    <Box>
      {/* Document header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          {docName}
        </Typography>

        {/* Action summary — tells the user what to focus on */}
        {summary && needsAttention > 0 && (
          <Alert
            severity="warning"
            icon={<WarningAmberIcon />}
            sx={{
              borderRadius: 2,
              "& .MuiAlert-message": { display: "flex", alignItems: "center", gap: 1 },
            }}
          >
            <Typography variant="body2" fontWeight={600}>
              {needsAttention} clause{needsAttention !== 1 ? "s" : ""} need attention
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, ml: 1 }}>
              {summary.severity_distribution.critical > 0 && (
                <Chip
                  label={`${summary.severity_distribution.critical} critical`}
                  size="small"
                  sx={{ bgcolor: severityColor.critical, color: "#fff", fontWeight: 600, fontSize: "0.7rem" }}
                />
              )}
              {summary.severity_distribution.high > 0 && (
                <Chip
                  label={`${summary.severity_distribution.high} high`}
                  size="small"
                  sx={{ bgcolor: severityColor.high, color: "#fff", fontWeight: 600, fontSize: "0.7rem" }}
                />
              )}
            </Box>
          </Alert>
        )}

        {summary && needsAttention === 0 && (
          <Alert severity="success" sx={{ borderRadius: 2 }}>
            <Typography variant="body2" fontWeight={600}>
              All clauses are within acceptable risk levels.
            </Typography>
          </Alert>
        )}
      </Box>

      {summary && <RiskSummaryCard summary={summary} />}

      <Typography variant="h5" fontWeight={600} gutterBottom>
        Clauses
      </Typography>

      <Filters
        severity={severity}
        onSeverityChange={setSeverity}
        category={category}
        onCategoryChange={setCategory}
        categories={categories}
      />

      <ClauseTable clauses={filtered} />
    </Box>
  );
}
