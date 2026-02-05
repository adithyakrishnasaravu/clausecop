import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { searchClauses } from "../lib/api";
import type { SearchResult } from "../lib/types";

const severityColor: Record<string, "default" | "success" | "warning" | "error"> = {
  low: "success",
  medium: "warning",
  high: "error",
  critical: "error",
};

export default function SearchPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const q = params.get("q") ?? "";
  const projectId = params.get("project_id");

  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    setError(null);
    searchClauses(q, {
      project_id: projectId ? Number(projectId) : undefined,
    })
      .then((data) => setResults(data.results))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [q, projectId]);

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 2 }}>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        Search results for "{q}"
      </Typography>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && results.length === 0 && q && (
        <Typography color="text.secondary" sx={{ mt: 4 }}>
          No matching clauses found.
        </Typography>
      )}

      {results.map((r, i) => (
        <Card
          key={`${r.clause_id}-${i}`}
          sx={{ mb: 2, bgcolor: "rgba(255,255,255,0.03)" }}
        >
          <CardActionArea onClick={() => navigate(`/clauses/${r.clause_id}`)}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                <Chip
                  label={r.category}
                  size="small"
                  sx={{ textTransform: "capitalize" }}
                />
                {r.severity && (
                  <Chip
                    label={r.severity}
                    size="small"
                    color={severityColor[r.severity] ?? "default"}
                    variant="outlined"
                    sx={{ textTransform: "capitalize" }}
                  />
                )}
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ ml: "auto" }}
                >
                  {(r.score * 100).toFixed(1)}% match
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {r.text}
              </Typography>
            </CardContent>
          </CardActionArea>
        </Card>
      ))}
    </Box>
  );
}
