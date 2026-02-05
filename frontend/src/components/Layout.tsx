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
import Collapse from "@mui/material/Collapse";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import ShieldIcon from "@mui/icons-material/Shield";
import DescriptionIcon from "@mui/icons-material/Description";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import FolderIcon from "@mui/icons-material/Folder";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import TextField from "@mui/material/TextField";
import {
  createProject,
  deleteDocument,
  deleteProject,
  fetchDocuments,
  fetchProjects,
  renameDocument,
  renameProject,
} from "../lib/api";
import type { DocumentInfo, Project } from "../lib/types";
import SearchBar from "./SearchBar";

const DRAWER_WIDTH = 260;

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [docs, setDocs] = useState<DocumentInfo[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<DocumentInfo | null>(null);
  const [deleteProjectTarget, setDeleteProjectTarget] = useState<Project | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editProjectValue, setEditProjectValue] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<Set<number>>(new Set());
  const [creatingProject, setCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const editRef = useRef<HTMLInputElement>(null);
  const editProjectRef = useRef<HTMLInputElement>(null);
  const newProjectRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const loadData = () => {
    fetchDocuments().then(setDocs).catch(() => {});
    fetchProjects().then(setProjects).catch(() => {});
  };

  const handleDeleteDoc = async () => {
    if (!deleteTarget) return;
    const id = deleteTarget.id;
    setDeleteTarget(null);
    try {
      await deleteDocument(id);
      loadData();
      if (location.pathname === `/documents/${id}`) {
        navigate("/");
      }
    } catch {
      // silently ignore
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteProjectTarget) return;
    const id = deleteProjectTarget.id;
    setDeleteProjectTarget(null);
    try {
      await deleteProject(id);
      loadData();
      if (location.pathname === `/projects/${id}`) {
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
        loadData();
      } catch {
        // silently ignore
      }
    }
    setEditingId(null);
  };

  const startEditingProject = (proj: Project) => {
    setEditingProjectId(proj.id);
    setEditProjectValue(proj.name);
    setTimeout(() => editProjectRef.current?.focus(), 0);
  };

  const commitProjectRename = async () => {
    if (editingProjectId === null) return;
    const trimmed = editProjectValue.trim();
    if (trimmed) {
      try {
        await renameProject(editingProjectId, trimmed);
        loadData();
        window.dispatchEvent(new Event("clausecop_projects_updated"));
      } catch {
        // silently ignore
      }
    }
    setEditingProjectId(null);
  };

  const toggleProject = (id: number) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateProject = async () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) {
      setCreatingProject(false);
      return;
    }
    try {
      const proj = await createProject(trimmed);
      loadData();
      window.dispatchEvent(new Event("clausecop_projects_updated"));
      navigate(`/projects/${proj.id}`);
    } catch {
      // silently ignore
    }
    setCreatingProject(false);
    setNewProjectName("");
  };

  useEffect(() => {
    loadData();
    const handler = () => loadData();
    window.addEventListener("clausecop_docs_updated", handler);
    window.addEventListener("clausecop_projects_updated", handler);
    return () => {
      window.removeEventListener("clausecop_docs_updated", handler);
      window.removeEventListener("clausecop_projects_updated", handler);
    };
  }, [location.pathname]);

  // Docs grouped by project
  const docsByProject = new Map<number, DocumentInfo[]>();
  const ungroupedDocs: DocumentInfo[] = [];
  const seen = new Set<string>();
  for (const doc of docs) {
    const key = `${doc.id}-${doc.filename}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (doc.project_id != null) {
      const list = docsByProject.get(doc.project_id) ?? [];
      list.push(doc);
      docsByProject.set(doc.project_id, list);
    } else {
      ungroupedDocs.push(doc);
    }
  }

  const renderDocItem = (doc: DocumentInfo, indent = false) => (
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
        pl: indent ? 5 : undefined,
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
            if (e.key === "Escape") setEditingId(null);
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
  );

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

      {/* Projects section */}
      <Divider sx={{ mx: 2, my: 1 }} />
      <Box sx={{ display: "flex", alignItems: "center", px: 2, pt: 1 }}>
        <Typography
          variant="overline"
          sx={{ color: "text.secondary", fontSize: "0.65rem", letterSpacing: "0.1em", flex: 1 }}
        >
          Projects
        </Typography>
        <IconButton
          size="small"
          onClick={() => {
            setCreatingProject(true);
            setTimeout(() => newProjectRef.current?.focus(), 0);
          }}
          sx={{ p: 0.25 }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
        </IconButton>
      </Box>

      {creatingProject && (
        <Box sx={{ px: 2, py: 0.5 }}>
          <TextField
            inputRef={newProjectRef}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateProject();
              if (e.key === "Escape") {
                setCreatingProject(false);
                setNewProjectName("");
              }
            }}
            onBlur={handleCreateProject}
            placeholder="Project name"
            size="small"
            variant="standard"
            fullWidth
            sx={{
              "& .MuiInput-input": { fontSize: "0.8rem" },
            }}
          />
        </Box>
      )}

      <List dense sx={{ flex: 1, overflow: "auto" }}>
        {projects.map((proj) => {
          const expanded = expandedProjects.has(proj.id);
          const projectDocs = docsByProject.get(proj.id) ?? [];

          return (
            <Box key={proj.id}>
              <ListItemButton
                selected={location.pathname === `/projects/${proj.id}`}
                onClick={() => navigate(`/projects/${proj.id}`)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  startEditingProject(proj);
                }}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.06)" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <FolderIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </ListItemIcon>
                {editingProjectId === proj.id ? (
                  <TextField
                    inputRef={editProjectRef}
                    value={editProjectValue}
                    onChange={(e) => setEditProjectValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitProjectRename();
                      if (e.key === "Escape") setEditingProjectId(null);
                    }}
                    onBlur={commitProjectRename}
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
                    primary={proj.name}
                    slotProps={{
                      primary: { fontSize: "0.8rem", fontWeight: 600, noWrap: true },
                    }}
                  />
                )}
                {projectDocs.length > 0 && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleProject(proj.id);
                    }}
                    sx={{ p: 0.25 }}
                  >
                    {expanded ? (
                      <ExpandLessIcon sx={{ fontSize: 16 }} />
                    ) : (
                      <ExpandMoreIcon sx={{ fontSize: 16 }} />
                    )}
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteProjectTarget(proj);
                  }}
                  sx={{
                    opacity: 0.4,
                    "&:hover": { opacity: 1, color: "error.main" },
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </ListItemButton>

              {projectDocs.length > 0 && (
                <Collapse in={expanded}>
                  {projectDocs.map((doc) => renderDocItem(doc, true))}
                </Collapse>
              )}
            </Box>
          );
        })}

        {/* Ungrouped documents */}
        {ungroupedDocs.length > 0 && (
          <>
            <Divider sx={{ mx: 2, my: 1 }} />
            <Typography
              variant="overline"
              sx={{ px: 2, pt: 1, color: "text.secondary", fontSize: "0.65rem", letterSpacing: "0.1em" }}
            >
              Ungrouped
            </Typography>
            {ungroupedDocs.map((doc) => renderDocItem(doc))}
          </>
        )}
      </List>
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
          <SearchBar />
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

      {/* Delete document dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>Delete document?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            "{deleteTarget?.display_name ?? deleteTarget?.filename}" and all its clauses and risk data will be permanently deleted.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button onClick={handleDeleteDoc} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete project dialog */}
      <Dialog open={!!deleteProjectTarget} onClose={() => setDeleteProjectTarget(null)}>
        <DialogTitle>Delete project?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            "{deleteProjectTarget?.name}" will be deleted. Documents in this project will become ungrouped (not deleted).
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteProjectTarget(null)}>Cancel</Button>
          <Button onClick={handleDeleteProject} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
