import { useNavigate } from "react-router-dom";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import Box from "@mui/material/Box";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import RiskBadge from "./RiskBadge";
import { severityColor } from "../theme";
import type { Clause } from "../lib/types";

interface Props {
  clauses: Clause[];
}

const columns: GridColDef<Clause>[] = [
  {
    field: "clause_index",
    headerName: "#",
    width: 60,
    valueGetter: (_value, row) => row.clause_index + 1,
  },
  {
    field: "section_number",
    headerName: "Section",
    width: 90,
    valueGetter: (_value, row) => row.section_number ?? "—",
  },
  {
    field: "title",
    headerName: "Title",
    flex: 1,
    minWidth: 200,
    valueGetter: (_value, row) => row.title ?? "Untitled",
  },
  {
    field: "category",
    headerName: "Category",
    width: 160,
    valueGetter: (_value, row) => row.category.replace(/_/g, " "),
  },
  {
    field: "risk_score",
    headerName: "Risk Score",
    width: 140,
    valueGetter: (_value, row) => row.risk?.risk_score ?? 0,
    renderCell: (params) => {
      const score = params.value as number;
      const severity = params.row.risk?.severity ?? "low";
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
          <Box sx={{ flex: 1 }}>
            <LinearProgress
              variant="determinate"
              value={score}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: "rgba(255,255,255,0.08)",
                "& .MuiLinearProgress-bar": {
                  bgcolor: severityColor[severity] ?? "#9e9e9e",
                  borderRadius: 4,
                },
              }}
            />
          </Box>
          <Typography variant="caption" fontWeight={700} sx={{ minWidth: 28 }}>
            {score}
          </Typography>
        </Box>
      );
    },
  },
  {
    field: "severity",
    headerName: "Severity",
    width: 110,
    valueGetter: (_value, row) => row.risk?.severity ?? "—",
    renderCell: (params) => {
      const severity = params.value as string;
      if (severity === "—") return "—";
      return <RiskBadge severity={severity} />;
    },
  },
  {
    field: "pages",
    headerName: "Pages",
    width: 80,
    valueGetter: (_value, row) =>
      row.page_start === row.page_end
        ? `${row.page_start}`
        : `${row.page_start}–${row.page_end}`,
  },
];

export default function ClauseTable({ clauses }: Props) {
  const navigate = useNavigate();

  return (
    <Box sx={{ width: "100%" }}>
      <DataGrid
        rows={clauses}
        columns={columns}
        initialState={{
          sorting: { sortModel: [{ field: "risk_score", sort: "desc" }] },
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        pageSizeOptions={[10, 25, 50]}
        onRowClick={(params) => navigate(`/clauses/${params.row.id}`)}
        disableRowSelectionOnClick
        autoHeight
        sx={{
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 3,
          bgcolor: "#1a1a1a",
          "& .MuiDataGrid-row": {
            cursor: "pointer",
            transition: "background-color 0.15s ease",
            "&:hover": { bgcolor: "rgba(255,255,255,0.04)" },
          },
          "& .MuiDataGrid-columnHeaders": {
            bgcolor: "rgba(255,255,255,0.03)",
            fontWeight: 700,
          },
          "& .MuiDataGrid-cell": {
            borderColor: "rgba(255,255,255,0.04)",
          },
        }}
      />
    </Box>
  );
}
