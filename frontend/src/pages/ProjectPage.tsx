import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import DescriptionIcon from "@mui/icons-material/Description";
import SendIcon from "@mui/icons-material/Send";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer";
import UploadDropzone from "../components/UploadDropzone";
import { askQuestion, fetchProject, renameProject } from "../lib/api";
import type { ProjectDetail, QAResponse } from "../lib/types";

interface QAEntry {
  question: string;
  result: QAResponse;
  expanded: boolean;
}

const severityColor: Record<string, "default" | "success" | "warning" | "error"> = {
  low: "success",
  medium: "warning",
  high: "error",
  critical: "error",
};

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = Number(id);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Inline rename
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  // Q&A — persist in sessionStorage per project
  const qaStorageKey = `clausecop_qa_${projectId}`;
  const [question, setQuestion] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaHistory, setQaHistory] = useState<QAEntry[]>(() => {
    try {
      const saved = sessionStorage.getItem(qaStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as QAEntry[];
        return parsed.map((e) => ({ ...e, expanded: false }));
      }
    } catch { /* ignore */ }
    return [];
  });
  const [qaError, setQaError] = useState<string | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(qaStorageKey, JSON.stringify(qaHistory));
    } catch { /* ignore */ }
  }, [qaHistory, qaStorageKey]);

  const load = useCallback((initial = false) => {
    if (initial) setLoading(true);
    fetchProject(projectId)
      .then((p) => {
        setProject(p);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  useEffect(() => {
    load(true);
    const handler = () => load();
    window.addEventListener("clausecop_docs_updated", handler);
    window.addEventListener("clausecop_projects_updated", handler);
    return () => {
      window.removeEventListener("clausecop_docs_updated", handler);
      window.removeEventListener("clausecop_projects_updated", handler);
    };
  }, [load]);

  const startEditing = () => {
    if (!project) return;
    setEditing(true);
    setEditValue(project.name);
    setTimeout(() => editRef.current?.focus(), 0);
  };

  const commitRename = async () => {
    const trimmed = editValue.trim();
    if (trimmed && project && trimmed !== project.name) {
      try {
        await renameProject(projectId, trimmed);
        load();
        window.dispatchEvent(new Event("clausecop_projects_updated"));
      } catch {
        // silently ignore
      }
    }
    setEditing(false);
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;
    setQaLoading(true);
    setQaError(null);
    try {
      const result = await askQuestion(trimmed, { project_id: projectId });
      setQaHistory((prev) => [
        { question: trimmed, result, expanded: true },
        ...prev.map((entry) => ({ ...entry, expanded: false })),
      ]);
      setQuestion("");
    } catch (err: unknown) {
      setQaError(err instanceof Error ? err.message : "Q&A failed");
    } finally {
      setQaLoading(false);
    }
  };

  const toggleEntry = (index: number) => {
    setQaHistory((prev) =>
      prev.map((entry, i) =>
        i === index ? { ...entry, expanded: !entry.expanded } : entry
      )
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !project) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error ?? "Project not found"}
      </Alert>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto", mt: 2 }}>
      {/* Header */}
      {editing ? (
        <TextField
          inputRef={editRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={commitRename}
          variant="standard"
          sx={{
            mb: 3,
            "& .MuiInput-input": { fontSize: "1.8rem", fontWeight: 700 },
          }}
        />
      ) : (
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{ mb: 3, cursor: "pointer" }}
          onDoubleClick={startEditing}
          title="Double-click to rename"
        >
          {project.name}
        </Typography>
      )}

      {/* Documents */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Documents
      </Typography>
      {project.documents.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          No documents in this project yet. Upload one below.
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
            mb: 3,
          }}
        >
          {project.documents.map((doc) => (
            <Card key={doc.id} sx={{ bgcolor: "rgba(255,255,255,0.03)" }}>
              <CardActionArea onClick={() => navigate(`/documents/${doc.id}`)}>
                <CardContent sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <DescriptionIcon sx={{ color: "text.secondary" }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {(doc.display_name ?? doc.filename).replace(/\.pdf$/i, "")}
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                      <Chip
                        label={doc.status}
                        size="small"
                        color={doc.status === "ready" ? "success" : "default"}
                        variant="outlined"
                        sx={{ textTransform: "capitalize", fontSize: "0.7rem" }}
                      />
                      {doc.num_pages && (
                        <Typography variant="caption" color="text.secondary">
                          {doc.num_pages} pages
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      )}

      {/* Upload */}
      <UploadDropzone projectId={projectId} />

      <Divider sx={{ my: 4 }} />

      {/* Q&A */}
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Ask about this deal
      </Typography>
      <Paper
        component="form"
        onSubmit={handleAsk}
        sx={{
          display: "flex",
          gap: 1,
          p: 1.5,
          bgcolor: "rgba(255,255,255,0.03)",
          mb: 2,
        }}
        elevation={0}
      >
        <TextField
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. What are the liability caps in this deal?"
          fullWidth
          size="small"
          variant="outlined"
          disabled={qaLoading}
        />
        <Button
          type="submit"
          variant="contained"
          disabled={qaLoading || !question.trim()}
          sx={{ minWidth: 48 }}
        >
          {qaLoading ? <CircularProgress size={20} /> : <SendIcon />}
        </Button>
      </Paper>

      {qaError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {qaError}
        </Alert>
      )}

      {qaHistory.map((entry, idx) => (
        <Paper
          key={idx}
          sx={{ mb: 1.5, bgcolor: "rgba(255,255,255,0.03)", overflow: "hidden" }}
          elevation={0}
        >
          <Box
            onClick={() => toggleEntry(idx)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              px: 2,
              py: 1.5,
              cursor: "pointer",
              "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
            }}
          >
            <QuestionAnswerIcon sx={{ color: "text.secondary", fontSize: 20 }} />
            <Typography
              variant="body2"
              fontWeight={600}
              sx={{ flex: 1, minWidth: 0 }}
              noWrap
            >
              {entry.question}
            </Typography>
            {entry.result.sources.length > 0 && (
              <Chip
                label={`${entry.result.sources.length} sources`}
                size="small"
                variant="outlined"
                sx={{ fontSize: "0.7rem" }}
              />
            )}
            <IconButton size="small">
              <ExpandMoreIcon
                sx={{
                  transform: entry.expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                }}
              />
            </IconButton>
          </Box>

          <Collapse in={entry.expanded}>
            <Box sx={{ px: 2, pb: 2 }}>
              <Typography
                variant="body2"
                sx={{ whiteSpace: "pre-wrap", mb: 2 }}
              >
                {entry.result.answer}
              </Typography>

              {entry.result.sources.length > 0 && (
                <>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                    Sources ({entry.result.sources.length} clauses)
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                    {entry.result.sources.map((s, i) => (
                      <Chip
                        key={i}
                        label={`${s.category}${s.severity ? ` (${s.severity})` : ""}`}
                        size="small"
                        color={s.severity ? severityColor[s.severity] ?? "default" : "default"}
                        variant="outlined"
                        onClick={() => navigate(`/clauses/${s.clause_id}`)}
                        clickable
                        sx={{ textTransform: "capitalize" }}
                      />
                    ))}
                  </Box>
                </>
              )}
            </Box>
          </Collapse>
        </Paper>
      ))}
    </Box>
  );
}
