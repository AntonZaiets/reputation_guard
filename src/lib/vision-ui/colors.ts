/** Vision UI palette subset used by ported dashboard widgets. */
export const VISION = {
  text: { main: "#a0aec0", focus: "#ffffff" },
  info: { main: "#0075ff", focus: "#3993fe" },
  success: { main: "#01b574", focus: "#35d28a" },
  error: { main: "#e31a1a", focus: "#ee5d50" },
  gradients: {
    card: {
      deg: "127.09",
      main: "rgba(6, 11, 40, 0.94) 19.41%",
      state: "rgba(10, 14, 35, 0.49) 76.65%",
    },
    cardDark: {
      deg: "126.97",
      main: "rgba(6, 11, 40, 0.74) 28.26%",
      state: "rgba(10, 14, 35, 0.71) 91.2%",
    },
    cardContent: {
      deg: "126.97",
      main: "rgb(6, 11, 40) 28.26%",
      state: "rgb(10, 14, 35) 91.2%",
    },
  },
  panel: "#22234b",
} as const;
