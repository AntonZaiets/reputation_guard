import type { SxProps, Theme } from "@mui/material/styles";

/** Scrollbar that matches Vision-style dark glass panels (Firefox + WebKit). */
export const visionDarkScrollContainerSx: SxProps<Theme> = {
  /** Firefox: `auto` is wider than `thin`. */
  scrollbarWidth: "auto",
  scrollbarColor: "rgba(255, 255, 255, 0.35) rgba(8, 12, 32, 0.85)",
  "&::-webkit-scrollbar": {
    width: 16,
    height: 16,
  },
  "&::-webkit-scrollbar-track": {
    background: "rgba(8, 12, 32, 0.9)",
    borderRadius: 12,
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(255, 255, 255, 0.22)",
    borderRadius: 12,
    border: "3px solid rgba(8, 12, 32, 0.9)",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "rgba(0, 117, 255, 0.55)",
  },
  "&::-webkit-scrollbar-corner": {
    background: "rgba(8, 12, 32, 0.9)",
  },
};

/** Subtle scrollbar for light inbox table on `/inbox`. */
export const visionLightScrollContainerSx: SxProps<Theme> = {
  scrollbarWidth: "auto",
  scrollbarColor: "rgba(0, 117, 255, 0.45) rgba(0, 0, 0, 0.06)",
  "&::-webkit-scrollbar": {
    width: 16,
    height: 16,
  },
  "&::-webkit-scrollbar-track": {
    background: "rgba(0, 0, 0, 0.04)",
    borderRadius: 12,
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(0, 117, 255, 0.35)",
    borderRadius: 12,
    border: "3px solid transparent",
    backgroundClip: "padding-box",
  },
  "&::-webkit-scrollbar-thumb:hover": {
    background: "rgba(0, 117, 255, 0.5)",
    backgroundClip: "padding-box",
  },
  "&::-webkit-scrollbar-corner": {
    background: "transparent",
  },
};
