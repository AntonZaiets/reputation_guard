import type { SxProps, Theme } from "@mui/material/styles";

export const ticketListTableContainerSx: SxProps<Theme> = {
  border: 1,
  borderColor: "divider",
  borderRadius: 2,
};

export const ticketListTableSx: SxProps<Theme> = { minWidth: 650 };

export const ticketListEmptyStateTypographySx: SxProps<Theme> = { py: 3 };

export const ticketListRowSx: SxProps<Theme> = { cursor: "pointer" };

export const ticketListSentimentChipSx: SxProps<Theme> = {
  bgcolor: "primary.light",
  color: "primary.contrastText",
};

export const ticketListDrawerPaperSx: SxProps<Theme> = {
  width: { xs: "100%", sm: 480, md: 560 },
  maxWidth: "100vw",
};

export const ticketListDetailRootSx: SxProps<Theme> = {
  display: "flex",
  flexDirection: "column",
  height: "100%",
};

export const ticketListDetailHeaderSx: SxProps<Theme> = {
  px: 2,
  py: 1.5,
  borderBottom: 1,
  borderColor: "divider",
};

export const ticketListDetailScrollSx: SxProps<Theme> = {
  flex: 1,
  overflow: "auto",
  p: 2,
};

export const ticketListReviewBodySx: SxProps<Theme> = { mt: 0.5, whiteSpace: "pre-wrap" };

export const ticketListSectionOverlineSx: SxProps<Theme> = {
  mt: 3,
  display: "block",
};

export const ticketListAiSummarySx: SxProps<Theme> = { mt: 0.5 };

export const ticketListRepliesTitleSx: SxProps<Theme> = { mt: 3, mb: 1.5 };

export const ticketListAnalyzeButtonSx: SxProps<Theme> = {
  py: 2,
  borderRadius: 2,
  fontWeight: 700,
  fontSize: "1rem",
  boxShadow: 2,
};

export const ticketListSnackbarAlertSx: SxProps<Theme> = { width: "100%" };
