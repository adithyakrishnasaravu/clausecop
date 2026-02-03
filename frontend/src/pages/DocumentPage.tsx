import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import Alert from "@mui/material/Alert";
import RiskSummaryCard from "../components/RiskSummary";
import ClauseTable from "../components/ClauseTable";
import Filters from "../components/Filters";
import { fetchClauses, fetchRiskSummary } from "../lib/api";
import type { Clause, RiskSummary } from "../lib/types";

export default function DocumentPage() {
  const { id } = useParams<{ id: string }>();
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

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Document #{id} — Risk Analysis
      </Typography>

      {summary && <RiskSummaryCard summary={summary} />}

      <Typography variant="h5" gutterBottom>
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
