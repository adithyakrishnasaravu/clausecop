import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { RiskSignals } from "../lib/types";

const SIGNAL_LABELS: Record<keyof RiskSignals, string> = {
  one_sided: "One-Sided",
  uncapped_liability: "Uncapped Liability",
  broad_indemnity: "Broad Indemnity",
  short_cure_period: "Short Cure Period",
  auto_renewal: "Auto-Renewal",
  non_standard: "Non-Standard",
  missing_mutual: "Missing Mutual",
  unlimited_ip: "Unlimited IP",
  weak_termination: "Weak Termination",
  vague_language: "Vague Language",
  weak_sla: "Weak SLA",
  poor_data_terms: "Poor Data Terms",
};

interface Props {
  signals: RiskSignals;
}

export default function SignalList({ signals }: Props) {
  const active = (Object.entries(signals) as [keyof RiskSignals, boolean][]).filter(
    ([, v]) => v
  );

  if (active.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
      {active.map(([key]) => (
        <Chip
          key={key}
          icon={<WarningAmberIcon fontSize="small" />}
          label={SIGNAL_LABELS[key]}
          variant="outlined"
          color="warning"
          size="small"
          sx={{ fontWeight: 500 }}
        />
      ))}
    </Box>
  );
}
