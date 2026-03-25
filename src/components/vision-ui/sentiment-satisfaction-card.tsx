import Mood from "@mui/icons-material/Mood";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { VISION } from "@/lib/vision-ui/colors";
import { linearGradient } from "@/lib/vision-ui/linear-gradient";
import { visionDashboardCardSx } from "@/lib/vision-ui/vision-card-sx";

export type SentimentSatisfactionCardProps = {
  /** Mean sentiment 1–100, or null when unknown. */
  averageSentiment: number | null;
  hasAnalyses: boolean;
};

export function SentimentSatisfactionCard({
  averageSentiment,
  hasAnalyses,
}: SentimentSatisfactionCardProps) {
  const { cardContent } = VISION.gradients;
  const value = hasAnalyses && averageSentiment != null ? Math.round(averageSentiment) : 0;
  const label =
    hasAnalyses && averageSentiment != null ? `${Math.round(averageSentiment)}%` : "—";

  return (
    <Card
      elevation={0}
      sx={{
        ...visionDashboardCardSx,
        display: "flex",
        flexDirection: "column",
        /** Фиксированная высота + обрезка по скруглению — нижний блок не «вылезает». */
        height: { xs: "auto", md: 340 },
        minHeight: { xs: 280, md: 340 },
        maxHeight: { md: 340 },
        overflow: "hidden",
        boxSizing: "border-box",
        p: 2.25,
      }}
    >
      <Box sx={{ flexShrink: 0, mb: 1 }}>
        <Typography variant="h6" fontWeight={700} sx={{ color: VISION.text.focus, mb: 0.5 }}>
          Sentiment index
        </Typography>
        <Typography variant="body2" sx={{ color: VISION.text.main, lineHeight: 1.45 }}>
          Mean score from AI-analyzed reviews (scale 1–100).
        </Typography>
      </Box>

      <Box
        sx={{
          flex: "1 1 0",
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          py: 0.5,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "relative",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress
            variant="determinate"
            value={value}
            size={128}
            thickness={4}
            sx={{
              color: VISION.info.main,
              "& .MuiCircularProgress-circle": {
                strokeLinecap: "round",
              },
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
            <Box
              sx={{
                bgcolor: VISION.info.main,
                width: 36,
                height: 36,
                borderRadius: "50%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Mood sx={{ fontSize: 20, color: "#fff" }} />
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          flexShrink: 0,
          width: "100%",
          boxSizing: "border-box",
          py: 1.5,
          px: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexDirection: "row",
          gap: 1,
          minHeight: 0,
          borderRadius: "12px",
          background: linearGradient(cardContent.main, cardContent.state, cardContent.deg),
          mt: 1,
        }}
      >
        <Typography variant="caption" sx={{ color: VISION.text.main, flexShrink: 0, pl: 0.25 }}>
          0%
        </Typography>
        <Box
          display="flex"
          flexDirection="column"
          justifyContent="center"
          alignItems="center"
          sx={{ minWidth: 0, flex: "1 1 auto", px: 0.5, py: 0.25 }}
        >
          <Typography
            variant="h5"
            sx={{ color: VISION.text.focus, fontWeight: 700, lineHeight: 1.15 }}
          >
            {label}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: VISION.text.main, mt: 0.25, textAlign: "center" }}
          >
            {hasAnalyses ? "Analyzed pool" : "No analyses yet"}
          </Typography>
        </Box>
        <Typography variant="caption" sx={{ color: VISION.text.main, flexShrink: 0, pr: 0.25 }}>
          100%
        </Typography>
      </Box>
    </Card>
  );
}
