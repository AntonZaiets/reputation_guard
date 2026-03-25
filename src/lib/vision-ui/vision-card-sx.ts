import type { SxProps, Theme } from "@mui/material/styles";
import { linearGradient } from "@/lib/vision-ui/linear-gradient";
import { VISION } from "@/lib/vision-ui/colors";

const { card } = VISION.gradients;

/** Default Vision UI glassmorphism card surface (dashboard). */
export const visionDashboardCardSx: SxProps<Theme> = {
  background: linearGradient(card.main, card.state, card.deg),
  backdropFilter: "blur(120px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "16px",
  boxShadow: "0 20px 27px 0 rgba(0, 0, 0, 0.05)",
  color: VISION.text.focus,
};

/** Sticky table header cells on the same glass surface (scrolls over rows). */
export const visionDashboardStickyHeaderSurfaceSx: SxProps<Theme> = {
  background: linearGradient(card.main, card.state, card.deg),
  backdropFilter: "blur(120px)",
};
