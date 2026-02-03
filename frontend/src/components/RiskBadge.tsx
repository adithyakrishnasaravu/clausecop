import Chip from "@mui/material/Chip";
import { severityColor } from "../theme";
import type { Severity } from "../lib/types";

interface Props {
  severity: Severity | string;
  size?: "small" | "medium";
}

export default function RiskBadge({ severity, size = "small" }: Props) {
  const color = severityColor[severity] ?? "#9e9e9e";
  return (
    <Chip
      label={severity.toUpperCase()}
      size={size}
      sx={{
        bgcolor: color,
        color: "#fff",
        fontWeight: 700,
        fontSize: size === "small" ? "0.7rem" : "0.8rem",
        letterSpacing: "0.05em",
      }}
    />
  );
}
