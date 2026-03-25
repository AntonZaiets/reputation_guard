"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        py: { xs: 4, sm: 6 },
        bgcolor: "grey.50",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Container maxWidth="sm">
        <Typography variant="h5" component="h1" fontWeight={700} gutterBottom>
          Dashboard could not load
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Fix the issue below, then try again. If you use Neon or another host, check{" "}
          <code>DATABASE_URL</code> and that migrations have been applied.
        </Typography>
        <Alert severity="error" sx={{ mb: 2, "& pre": { m: 0, whiteSpace: "pre-wrap" } }}>
          {error.message}
        </Alert>
        {error.digest ? (
          <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 2 }}>
            Error ID: {error.digest}
          </Typography>
        ) : null}
        <Button variant="contained" size="large" onClick={() => reset()}>
          Reload dashboard
        </Button>
      </Container>
    </Box>
  );
}
