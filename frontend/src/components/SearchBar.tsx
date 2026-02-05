import { useState } from "react";
import { useNavigate } from "react-router-dom";
import InputBase from "@mui/material/InputBase";
import IconButton from "@mui/material/IconButton";
import SearchIcon from "@mui/icons-material/Search";
import Box from "@mui/material/Box";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/search?q=${encodeURIComponent(trimmed)}`);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: "flex",
        alignItems: "center",
        bgcolor: "rgba(255,255,255,0.08)",
        borderRadius: 2,
        px: 1.5,
        py: 0.25,
        ml: "auto",
        width: { xs: 160, sm: 260 },
        transition: "width 0.2s",
        "&:focus-within": {
          bgcolor: "rgba(255,255,255,0.12)",
          width: { xs: 200, sm: 320 },
        },
      }}
    >
      <SearchIcon sx={{ color: "text.secondary", mr: 1, fontSize: 20 }} />
      <InputBase
        placeholder="Search clauses..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        sx={{
          flex: 1,
          color: "inherit",
          fontSize: "0.875rem",
          "& ::placeholder": { color: "rgba(255,255,255,0.5)", opacity: 1 },
        }}
      />
    </Box>
  );
}
