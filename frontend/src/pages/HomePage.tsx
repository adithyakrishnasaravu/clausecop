import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import UploadDropzone from "../components/UploadDropzone";

export default function HomePage() {
  return (
    <Box sx={{ maxWidth: 720, mx: "auto", mt: 4 }}>
      <Typography variant="h3" fontWeight={800} gutterBottom>
        Upload a contract. Get risk analysis in seconds.
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
        ClauseCop scans SaaS agreements and MSAs clause-by-clause, scores risk
        with AI, and gives you actionable negotiation recommendations — so you
        never sign a bad deal.
      </Typography>
      <UploadDropzone />
    </Box>
  );
}
