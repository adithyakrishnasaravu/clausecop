import { useEffect, useState } from "react";
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
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import ShieldIcon from "@mui/icons-material/Shield";
import DescriptionIcon from "@mui/icons-material/Description";

const DRAWER_WIDTH = 260;
const STORAGE_KEY = "clausecop_documents";

export interface StoredDoc {
  id: number;
  name: string;
  uploadedAt: string;
}

export function getStoredDocs(): StoredDoc[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function addStoredDoc(doc: StoredDoc) {
  const docs = getStoredDocs().filter((d) => d.id !== doc.id);
  docs.unshift(doc);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  window.dispatchEvent(new Event("clausecop_docs_updated"));
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [docs, setDocs] = useState<StoredDoc[]>(getStoredDocs);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handler = () => setDocs(getStoredDocs());
    window.addEventListener("clausecop_docs_updated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("clausecop_docs_updated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

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
            primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 500 }}
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
            {docs.map((doc) => (
              <ListItemButton
                key={doc.id}
                selected={location.pathname === `/documents/${doc.id}`}
                onClick={() => navigate(`/documents/${doc.id}`)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.06)" },
                }}
              >
                <ListItemIcon sx={{ minWidth: 32 }}>
                  <DescriptionIcon fontSize="small" sx={{ color: "text.secondary" }} />
                </ListItemIcon>
                <ListItemText
                  primary={doc.name}
                  primaryTypographyProps={{
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    noWrap: true,
                  }}
                  secondary={`ID: ${doc.id}`}
                  secondaryTypographyProps={{ fontSize: "0.65rem" }}
                />
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
    </Box>
  );
}
