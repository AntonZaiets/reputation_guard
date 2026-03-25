import type { SxProps, Theme } from "@mui/material/styles";

export const workspaceSelectorRootBoxSx: SxProps<Theme> = {
  minWidth: { xs: "100%", sm: 260 },
  maxWidth: 360,
};

export const workspaceSelectorLabelSx: SxProps<Theme> = {
  display: "block",
  mb: 0.5,
  fontWeight: 600,
  letterSpacing: 0.4,
};

export const workspaceSelectorSelectMenuPaperSx: SxProps<Theme> = {
  maxHeight: 320,
  overflow: "auto",
};

export const workspaceSelectorAddMenuItemSx: SxProps<Theme> = {
  position: "sticky",
  bottom: 0,
  zIndex: 1,
  bgcolor: "background.paper",
  borderTop: 1,
  borderColor: "divider",
  gap: 1,
};

export const workspaceSelectorLoadErrorSx: SxProps<Theme> = {
  display: "block",
  mt: 0.5,
};

export const workspaceSelectorDialogActionsSx: SxProps<Theme> = {
  px: 3,
  pb: 2,
};
