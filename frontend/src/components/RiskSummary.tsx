import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import RiskBadge from "./RiskBadge";
import { severityColor } from "../theme";
import type { RiskSummary as RiskSummaryType } from "../lib/types";

interface Props {
  summary: RiskSummaryType;
}

export default function RiskSummary({ summary }: Props) {
  const scoreData = [
    { name: "score", value: summary.overall_score },
    { name: "remaining", value: 100 - summary.overall_score },
  ];

  const distData = [
    { name: "Critical", count: summary.severity_distribution.critical, color: severityColor.critical },
    { name: "High", count: summary.severity_distribution.high, color: severityColor.high },
    { name: "Medium", count: summary.severity_distribution.medium, color: severityColor.medium },
    { name: "Low", count: summary.severity_distribution.low, color: severityColor.low },
  ];

  return (
    <Box sx={{ mb: 4 }}>
      {/* Stat cards row */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" },
          gap: 2,
          mb: 3,
        }}
      >
        {/* Overall score gauge */}
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ textAlign: "center", py: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Overall Risk Score
            </Typography>
            <Box sx={{ display: "flex", justifyContent: "center", my: 1 }}>
              <PieChart width={140} height={140}>
                <Pie
                  data={scoreData}
                  cx={65}
                  cy={65}
                  innerRadius={45}
                  outerRadius={65}
                  startAngle={90}
                  endAngle={-270}
                  dataKey="value"
                  stroke="none"
                >
                  <Cell fill={severityColor[summary.overall_severity]} />
                  <Cell fill="rgba(255,255,255,0.08)" />
                </Pie>
              </PieChart>
            </Box>
            <Typography variant="h3" fontWeight={700}>
              {summary.overall_score}
            </Typography>
            <RiskBadge severity={summary.overall_severity} size="medium" />
          </CardContent>
        </Card>

        {/* Severity distribution */}
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ py: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Severity Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={distData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={60} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {distData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <Card elevation={2} sx={{ borderRadius: 3 }}>
          <CardContent sx={{ py: 3 }}>
            <Typography variant="overline" color="text.secondary">
              Contract Stats
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Clauses
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {summary.total_clauses}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Assessed
                </Typography>
                <Typography variant="h6" fontWeight={700}>
                  {summary.assessed_clauses}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography variant="body2" color="text.secondary">
                  High + Critical
                </Typography>
                <Typography variant="h6" fontWeight={700} color="error">
                  {summary.severity_distribution.high +
                    summary.severity_distribution.critical}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Top risks */}
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Risks
          </Typography>
          <List disablePadding>
            {summary.top_risks.map((risk, idx) => (
              <Box key={risk.clause_id}>
                {idx > 0 && <Divider />}
                <ListItem sx={{ py: 1.5 }}>
                  <ListItemText
                    primary={
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {risk.section_number
                            ? `§${risk.section_number}`
                            : `#${risk.clause_index + 1}`}{" "}
                          {risk.title ?? "Untitled"}
                        </Typography>
                        <RiskBadge severity={risk.severity} />
                        <Typography variant="caption" color="text.secondary">
                          Score: {risk.risk_score}
                        </Typography>
                      </Box>
                    }
                    secondary={risk.summary}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </CardContent>
      </Card>

      {/* Safe clauses */}
      {summary.safe_clauses && summary.safe_clauses.length > 0 && (
        <Card
          elevation={2}
          sx={{
            borderRadius: 3,
            mt: 2,
            borderLeft: `4px solid ${severityColor.low}`,
          }}
        >
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: severityColor.low }}>
              Good to Go
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              These clauses are standard and pose minimal risk.
            </Typography>
            <List disablePadding>
              {summary.safe_clauses.map((clause, idx) => (
                <Box key={clause.clause_id}>
                  {idx > 0 && <Divider />}
                  <ListItem sx={{ py: 1 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <CheckCircleOutlineIcon sx={{ color: severityColor.low }} />
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle2" fontWeight={600}>
                          {clause.section_number
                            ? `§${clause.section_number}`
                            : `#${clause.clause_index + 1}`}{" "}
                          {clause.title ?? "Untitled"}
                        </Typography>
                      }
                      secondary={clause.summary}
                    />
                  </ListItem>
                </Box>
              ))}
            </List>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
