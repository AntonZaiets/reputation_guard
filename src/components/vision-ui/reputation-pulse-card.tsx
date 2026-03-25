import MoreHoriz from "@mui/icons-material/MoreHoriz";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { VISION } from "@/lib/vision-ui/colors";
import { linearGradient } from "@/lib/vision-ui/linear-gradient";

export type ReputationPulseCardProps = {
  totalReviews: number;
  criticalIssuesCount: number;
  averageSentiment: number | null;
  hasAnalyses: boolean;
};

export function ReputationPulseCard({
  totalReviews,
  criticalIssuesCount,
  averageSentiment,
  hasAnalyses,
}: ReputationPulseCardProps) {
  const { cardContent, cardDark } = VISION.gradients;
  /** 0–10 “health” from mean sentiment (1–100 → 0.1–10.0). */
  const healthScore =
    hasAnalyses && averageSentiment != null
      ? Math.round(averageSentiment * 10) / 100
      : null;
  const progressValue =
    hasAnalyses && averageSentiment != null ? Math.min(100, Math.max(0, averageSentiment)) : 0;

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        minHeight: { xs: 320, md: 340 },
        background: linearGradient(cardDark.main, cardDark.state, cardDark.deg),
        backdropFilter: "blur(120px)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderRadius: "16px",
        boxShadow: "0 20px 27px 0 rgba(0, 0, 0, 0.05)",
        color: VISION.text.focus,
        p: 2.75,
      }}
    >
      <Box width="100%">
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          width="100%"
          mb={5}
        >
          <Typography variant="h6" fontWeight={700} sx={{ color: VISION.text.focus }}>
            Reputation pulse
          </Typography>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              width: 37,
              height: 37,
              borderRadius: "12px",
              bgcolor: VISION.panel,
            }}
            aria-hidden
          >
            <MoreHoriz sx={{ color: VISION.info.main, fontSize: 20 }} />
          </Box>
        </Box>
        <Box
          display="flex"
          flexDirection={{ xs: "column", md: "row" }}
          alignItems="center"
          justifyContent={{ xs: "center", md: "flex-start" }}
          gap={2}
        >
          <Stack direction="column" spacing={2.5} sx={{ mr: { md: 2 }, width: "100%", maxWidth: 220 }}>
            <Box
              display="flex"
              flexDirection="column"
              p="20px 22px"
              sx={{
                background: linearGradient(cardContent.main, cardContent.state, cardContent.deg),
                borderRadius: "20px",
              }}
            >
              <Typography variant="body2" sx={{ color: VISION.text.main, mb: 0.75 }}>
                Reviews ingested
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: VISION.text.focus }}>
                {totalReviews.toLocaleString()}
              </Typography>
            </Box>
            <Box
              display="flex"
              flexDirection="column"
              p="20px 22px"
              sx={{
                background: linearGradient(cardContent.main, cardContent.state, cardContent.deg),
                borderRadius: "20px",
              }}
            >
              <Typography variant="body2" sx={{ color: VISION.text.main, mb: 0.75 }}>
                Critical flags
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: VISION.text.focus }}>
                {criticalIssuesCount.toLocaleString()}
              </Typography>
            </Box>
          </Stack>
          <Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
            <CircularProgress
              variant="determinate"
              value={progressValue}
              size={200}
              thickness={4}
              sx={{
                color: VISION.success.main,
                "& .MuiCircularProgress-circle": { strokeLinecap: "round" },
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Box display="flex" flexDirection="column" alignItems="center">
                <Typography variant="body2" sx={{ color: VISION.text.main, mb: 0.5 }}>
                  Health
                </Typography>
                <Typography variant="h3" fontWeight={700} sx={{ color: VISION.text.focus, mb: 0.5 }}>
                  {healthScore != null ? healthScore : "—"}
                </Typography>
                <Typography variant="body2" sx={{ color: VISION.text.main }}>
                  of 10
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
