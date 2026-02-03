import Box from "@mui/material/Box";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { severityColor } from "../theme";

interface Props {
  severity: string | null;
  onSeverityChange: (val: string | null) => void;
  category: string;
  onCategoryChange: (val: string) => void;
  categories: string[];
}

export default function Filters({
  severity,
  onSeverityChange,
  category,
  onCategoryChange,
  categories,
}: Props) {
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap", mb: 2 }}>
      <ToggleButtonGroup
        value={severity}
        exclusive
        onChange={(_, val) => onSeverityChange(val)}
        size="small"
      >
        {(["critical", "high", "medium", "low"] as const).map((s) => (
          <ToggleButton
            key={s}
            value={s}
            sx={{
              textTransform: "capitalize",
              fontWeight: 600,
              fontSize: "0.75rem",
              "&.Mui-selected": {
                bgcolor: severityColor[s],
                color: "#fff",
                "&:hover": { bgcolor: severityColor[s] },
              },
            }}
          >
            {s}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Category</InputLabel>
        <Select
          value={category}
          label="Category"
          onChange={(e) => onCategoryChange(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          {categories.map((c) => (
            <MenuItem key={c} value={c} sx={{ textTransform: "capitalize" }}>
              {c.replace(/_/g, " ")}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
