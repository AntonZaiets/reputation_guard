import ArrowForward from "@mui/icons-material/ArrowForward";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import { visionDashboardCardSx } from "@/lib/vision-ui/vision-card-sx";
import { VISION } from "@/lib/vision-ui/colors";

export type DashboardWelcomeCardProps = {
  workspaceLabel: string | null;
};

export function DashboardWelcomeCard({ workspaceLabel }: DashboardWelcomeCardProps) {
  const name = workspaceLabel?.trim() || "your workspace";

  return (
    <Card
      elevation={0}
      sx={{
        ...visionDashboardCardSx,
        height: { xs: "auto", md: 340 },
        minHeight: { xs: 280, md: 340 },
        py: 4,
        px: 3,
        backgroundImage: `linear-gradient(105deg, rgba(6, 11, 40, 0.92) 0%, rgba(10, 14, 35, 0.55) 45%, rgba(6, 11, 40, 0.35) 100%), url(/vision-ui/cardimgfree.png)`,
        backgroundSize: "cover",
        backgroundPosition: "50% 50%",
      }}
    >
      <Box
        height="100%"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        gap={2}
      >
        <Box>
          <Typography
            variant="button"
            sx={{ color: VISION.text.main, fontWeight: 400, display: "block", mb: 1.5 }}
          >
            Welcome back
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ color: VISION.text.focus, mb: 2 }}>
            {name}
          </Typography>
          <Typography
            variant="subtitle1"
            sx={{ color: VISION.text.main, fontWeight: 400, lineHeight: 1.6 }}
          >
            Monitor reviews, sentiment, and critical issues in one place.
            <br />
            Connect sources in the sidebar to start ingesting feedback.
          </Typography>
        </Box>
        <IconButton
          component="a"
          href="#data-sources"
          size="small"
          sx={{
            alignSelf: "flex-start",
            color: VISION.text.focus,
            borderRadius: 1,
            px: 0,
            "&:hover": { bgcolor: "rgba(255,255,255,0.06)" },
          }}
        >
          <Typography variant="button" component="span" sx={{ mr: 0.5 }}>
            Data sources
          </Typography>
          <ArrowForward sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>
    </Card>
  );
}
