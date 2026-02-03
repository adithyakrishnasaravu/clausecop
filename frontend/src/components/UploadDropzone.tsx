import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Alert from "@mui/material/Alert";
import { uploadDocument } from "../lib/api";
import { addStoredDoc } from "./Layout";

export default function UploadDropzone() {
  const navigate = useNavigate();
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      if (file.type !== "application/pdf") {
        setError("Only PDF files are supported.");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const res = await uploadDocument(file);
        addStoredDoc({
          id: res.document_id,
          name: file.name.replace(/\.pdf$/i, ""),
          uploadedAt: new Date().toISOString(),
        });
        navigate(`/documents/${res.document_id}`);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [navigate]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <Box>
      <Paper
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        elevation={0}
        sx={{
          border: "2px dashed",
          borderColor: dragging ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.1)",
          bgcolor: dragging ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
          borderRadius: 3,
          p: 6,
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s ease",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.3)",
            bgcolor: "rgba(255,255,255,0.04)",
          },
        }}
        onClick={() => document.getElementById("pdf-input")?.click()}
      >
        <input
          id="pdf-input"
          type="file"
          accept=".pdf"
          hidden
          onChange={onInputChange}
        />
        <CloudUploadIcon sx={{ fontSize: 56, color: "text.secondary", mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Drop a contract PDF here
        </Typography>
        <Typography variant="body2" color="text.secondary">
          or click to browse — PDF files only
        </Typography>
      </Paper>

      {uploading && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Uploading and analyzing contract...
          </Typography>
          <LinearProgress color="secondary" sx={{ borderRadius: 2 }} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
