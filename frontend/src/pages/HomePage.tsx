import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import UploadDropzone from "../components/UploadDropzone";

export default function HomePage() {
  return (
    <Box sx={{ maxWidth: 720, mx: "auto" }}>
      <Typography variant="h4" gutterBottom>
        Contract Intelligence
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Upload a SaaS contract or MSA to get an instant risk analysis with
        clause-by-clause scoring and negotiation recommendations.
      </Typography>
      <UploadDropzone />
    </Box>
  );
}
