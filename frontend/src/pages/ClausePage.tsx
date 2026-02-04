import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Skeleton from "@mui/material/Skeleton";
import Chip from "@mui/material/Chip";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RiskBadge from "../components/RiskBadge";
import SignalList from "../components/SignalList";
import { severityColor } from "../theme";
import { fetchClause } from "../lib/api";
import type { ClauseDetail } from "../lib/types";

export default function ClausePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [clause, setClause] = useState<ClauseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchClause(Number(id))
      .then(setClause)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={200} height={40} />
        <Skeleton variant="rounded" height={160} sx={{ my: 2 }} />
        <Skeleton variant="rounded" height={300} />
      </Box>
    );
  }

  if (error || !clause) {
    return <Alert severity="error">{error ?? "Clause not found."}</Alert>;
  }

  const risk = clause.risk;

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(`/documents/${clause.document_id}`)}
        sx={{ mb: 2 }}
      >
        Back to document
      </Button>

      {/* Header */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, flexWrap: "wrap" }}>
        <Typography variant="h4">
          {clause.section_number ? `§${clause.section_number}` : `Clause #${clause.clause_index + 1}`}
        </Typography>
        <Chip
          label={clause.category.replace(/_/g, " ")}
          variant="outlined"
          sx={{ textTransform: "capitalize", fontWeight: 600 }}
        />
        {risk && <RiskBadge severity={risk.severity} size="medium" />}
      </Box>

      {clause.title && (
        <Typography variant="h5" color="text.secondary" gutterBottom>
          {clause.title}
        </Typography>
      )}

      {/* Risk card */}
      {risk && (
        <Card
          elevation={2}
          sx={{
            mb: 3,
            borderRadius: 3,
            borderLeft: `6px solid ${severityColor[risk.severity]}`,
          }}
        >
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
              <Typography variant="h3" fontWeight={700}>
                {risk.risk_score}
              </Typography>
              <Box>
                <Typography variant="overline" color="text.secondary">
                  Risk Score
                </Typography>
                <Box>
                  <RiskBadge severity={risk.severity} />
                </Box>
              </Box>
            </Box>

            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Risk Summary
              </Typography>
              {risk.summary}
            </Alert>

            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={700}>
                Recommendation
              </Typography>
              {risk.recommendation}
            </Alert>

            <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
              Active Risk Signals
            </Typography>
            <SignalList signals={risk.signals} />
          </CardContent>
        </Card>
      )}

      {/* Clause text */}
      <Paper
        elevation={0}
        sx={{ p: 3, borderRadius: 3, bgcolor: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <Typography variant="overline" color="text.secondary" gutterBottom>
          Full Clause Text — Pages {clause.page_start}
          {clause.page_start !== clause.page_end && `–${clause.page_end}`}
        </Typography>
        <Typography
          variant="body1"
          sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8, mt: 1 }}
        >
          {clause.text}
        </Typography>
      </Paper>
    </Box>
  );
}
