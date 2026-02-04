import { useEffect, useRef, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import ShieldIcon from "@mui/icons-material/Shield";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteIcon from "@mui/icons-material/Delete";
import TextField from "@mui/material/TextField";
import { deleteDocument, fetchDocuments, renameDocument } from "../lib/api";
import type { DocumentInfo } from "../lib/types";

const DRAWER_WIDTH = 260;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DocumentInfo | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const editRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const loadDocs = () => {
    fetchDocuments().then(setDocs).catch(() => {});
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteDocument(id);
      loadDocs();
      if (location.pathname === `/documents/${id}`) {
        navigate("/");
      }
    } catch {
      // silently ignore
    }
  };

  const startEditing = (doc: DocumentInfo) => {
    setEditingId(doc.id);
    setEditValue((doc.display_name ?? doc.filename).replace(/\.pdf$/i, ""));
    setTimeout(() => editRef.current?.focus(), 0);
  };

  const commitRename = async () => {
    if (editingId === null) return;
    const trimmed = editValue.trim();
    if (trimmed) {
      try {
        await renameDocument(editingId, trimmed);
        loadDocs();
      } catch {
        // silently ignore
      }
    }
    setEditingId(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  useEffect(() => {
    loadDocs();
    // Refresh sidebar when navigating (catches new uploads)
    const handler = () => loadDocs();
    window.addEventListener("clausecop_docs_updated", handler);
    return () => window.removeEventListener("clausecop_docs_updated", handler);
  }, [location.pathname]);

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <List sx={{ mt: 1 }}>
        <ListItemButton
          selected={location.pathname === "/"}
          onClick={() => navigate("/")}
          sx={{
            borderRadius: 2,
            mx: 1,
            "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.06)" },
          }}
        >
          <ListItemIcon sx={{ minWidth: 36 }}>
            <HomeIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText
            primary="Home"
            slotProps={{ primary: { fontSize: "0.875rem", fontWeight: 500 } }}
          />
        </ListItemButton>
      </List>

      {docs.length > 0 && (
        <>
          <Divider sx={{ mx: 2, my: 1 }} />
          <Typography
            variant="overline"
            sx={{ px: 2, pt: 1, color: "text.secondary", fontSize: "0.65rem", letterSpacing: "0.1em" }}
          >
            Documents
          </Typography>
          <List dense sx={{ flex: 1, overflow: "auto" }}>
            {docs
              .filter((doc, idx, arr) =>
                arr.findIndex((d) => d.filename === doc.filename) === idx
              )
              .map((doc) => (
              <ListItemButton
                key={doc.id}
                selected={location.pathname === `/documents/${doc.id}`}
                onClick={() => navigate(`/documents/${doc.id}`)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startEditing(doc);
                }}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.06)" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <DescriptionIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </ListItemIcon>
                {editingId === doc.id ? (
                  <TextField
                    inputRef={editRef}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") cancelEditing();
                    }}
                    onBlur={commitRename}
                    onClick={(e) => e.stopPropagation()}
                    size="small"
                    variant="standard"
                    sx={{
                      flex: 1,
                      "& .MuiInput-input": { fontSize: "0.8rem", fontWeight: 500, py: 0 },
                    }}
                  />
                ) : (
                  <ListItemText
                    primary={(doc.display_name ?? doc.filename).replace(/\.pdf$/i, "")}
                    slotProps={{
                      primary: { fontSize: "0.8rem", fontWeight: 500, noWrap: true },
                    }}
                  />
                )}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(doc);
                  }}
                  sx={{
                    opacity: 0.4,
                    "&:hover": { opacity: 1, color: "error.main" },
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
        </>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <ShieldIcon sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography
            variant="h6"
            noWrap
            sx={{ cursor: "pointer", fontWeight: 700, letterSpacing: "-0.02em" }}
            onClick={() => navigate("/")}
          >
            ClauseCop
          </Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": { width: DRAWER_WIDTH },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
          },
        }}
        open
      >
        <Toolbar />
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: { md: `${DRAWER_WIDTH}px` },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Outlet />
      </Box>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete document?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            "{deleteTarget?.display_name ?? deleteTarget?.filename}" and all its clauses and risk data will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
