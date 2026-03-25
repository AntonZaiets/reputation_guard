import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { visionDashboardCardSx } from "@/lib/vision-ui/vision-card-sx";
import { VISION } from "@/lib/vision-ui/colors";

const percentageColor: Record<
  "success" | "error" | "info" | "warning",
  string
> = {
  success: VISION.success.main,
  error: VISION.error.main,
  info: VISION.info.main,
  warning: "#ffb547",
};

export type MiniStatisticsCardProps = {
  title: string;
  count: string | number;
  percentage?: { color: keyof typeof percentageColor; text: string };
  icon: ReactNode;
};

export function MiniStatisticsCard({
  title,
  count,
  percentage,
  icon,
}: MiniStatisticsCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        ...visionDashboardCardSx,
        p: "17px",
      }}
    >
      <Grid container alignItems="center" spacing={0}>
        <Grid size={{ xs: 8 }}>
          <Box lineHeight={1}>
            <Typography
              variant="caption"
              sx={{
                color: VISION.text.main,
                textTransform: "capitalize",
                fontWeight: 500,
                display: "block",
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight={700}
              sx={{ color: VISION.text.focus, mt: 0.5 }}
              component="p"
            >
              {count}{" "}
              {percentage ? (
                <Typography
                  component="span"
                  variant="caption"
                  fontWeight={700}
                  sx={{ color: percentageColor[percentage.color] }}
                >
                  {percentage.text}
                </Typography>
              ) : null}
            </Typography>
          </Box>
        </Grid>
        <Grid size={{ xs: 4 }} sx={{ display: "flex", justifyContent: "flex-end" }}>
          <Box
            sx={{
              bgcolor: VISION.info.main,
              color: "#fff",
              width: "3rem",
              height: "3rem",
              borderRadius: "12px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              boxShadow: "0 4px 6px rgba(0, 117, 255, 0.35)",
            }}
          >
            {icon}
          </Box>
        </Grid>
      </Grid>
    </Card>
  );
}
