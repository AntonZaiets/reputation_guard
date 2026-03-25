"use client";

import AddBusinessOutlinedIcon from "@mui/icons-material/AddBusinessOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { type SelectChangeEvent } from "@mui/material/Select";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {
  workspaceSelectorAddMenuItemSx,
  workspaceSelectorDialogActionsSx,
  workspaceSelectorLabelSx,
  workspaceSelectorLoadErrorSx,
  workspaceSelectorRootBoxSx,
  workspaceSelectorSelectMenuPaperSx,
} from "./workspace-selector.styles";
import type { WorkspaceSelectorProps } from "./workspace-selector.types";
import { useWorkspaceSelector } from "./use-workspace-selector";

const selectDarkSx = {
  color: "#fff",
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.22)",
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(255,255,255,0.35)",
  },
  "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: "rgba(0, 117, 255, 0.85)",
  },
  "& .MuiSvgIcon-root": { color: "rgba(255,255,255,0.75)" },
} as const;

export function WorkspaceSelector({
  resolvedWorkspaceId,
  darkSurface = false,
}: WorkspaceSelectorProps) {
  const {
    workspaces,
    loadError,
    effectiveWorkspaceId,
    selectedLabel,
    addOpen,
    newCompanyName,
    setNewCompanyName,
    creating,
    createError,
    handleSelectChange,
    handleCloseAdd,
    handleCreateCompany,
    addNewValue,
  } = useWorkspaceSelector(resolvedWorkspaceId);

  const onSelectChange = (event: SelectChangeEvent<string>) => {
    handleSelectChange(event.target.value);
  };

  return (
    <>
      <Box sx={workspaceSelectorRootBoxSx}>
        <Typography
          variant="caption"
          color={darkSurface ? undefined : "text.secondary"}
          sx={{
            ...workspaceSelectorLabelSx,
            ...(darkSurface ? { color: "rgba(255,255,255,0.65)" } : {}),
          }}
        >
          Current Company
        </Typography>
        <FormControl size="small" fullWidth disabled={Boolean(loadError) && workspaces.length === 0}>
          <InputLabel
            id="workspace-select-label"
            sx={
              darkSurface
                ? { color: "rgba(255,255,255,0.65)", "&.Mui-focused": { color: "#7ab8ff" } }
                : undefined
            }
          >
            Company
          </InputLabel>
          <Select<string>
            labelId="workspace-select-label"
            id="workspace-select"
            label="Company"
            value={effectiveWorkspaceId}
            displayEmpty
            onChange={onSelectChange}
            sx={darkSurface ? selectDarkSx : undefined}
            renderValue={(value) => {
              if (!value) {
                return (
                  <Typography
                    variant="body2"
                    color={darkSurface ? undefined : "text.secondary"}
                    sx={darkSurface ? { color: "rgba(255,255,255,0.55)" } : undefined}
                  >
                    {workspaces.length === 0 ? "No companies yet" : "Select a company"}
                  </Typography>
                );
              }
              return selectedLabel || value;
            }}
            MenuProps={{
              PaperProps: {
                sx: workspaceSelectorSelectMenuPaperSx,
              },
              anchorOrigin: { vertical: "bottom", horizontal: "left" },
              transformOrigin: { vertical: "top", horizontal: "left" },
            }}
          >
            {workspaces.map((w) => (
              <MenuItem key={w.id} value={w.id}>
                {w.name}
              </MenuItem>
            ))}
            <MenuItem value={addNewValue} sx={workspaceSelectorAddMenuItemSx}>
              <AddBusinessOutlinedIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={600}>
                + Add New Company
              </Typography>
            </MenuItem>
          </Select>
        </FormControl>
        {loadError ? (
          <Typography
            variant="caption"
            color={darkSurface ? undefined : "error"}
            sx={{
              ...workspaceSelectorLoadErrorSx,
              ...(darkSurface ? { color: "#ff8a8a" } : {}),
            }}
          >
            {loadError}
          </Typography>
        ) : null}
      </Box>

      <Dialog open={addOpen} onClose={handleCloseAdd} fullWidth maxWidth="xs">
        <DialogTitle>Add New Company</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Company Name"
            fullWidth
            variant="outlined"
            value={newCompanyName}
            onChange={(e) => setNewCompanyName(e.target.value)}
            disabled={creating}
            error={Boolean(createError)}
            helperText={createError}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void handleCreateCompany();
              }
            }}
          />
        </DialogContent>
        <DialogActions sx={workspaceSelectorDialogActionsSx}>
          <Button onClick={handleCloseAdd} disabled={creating}>
            Cancel
          </Button>
          <Button variant="contained" onClick={() => void handleCreateCompany()} disabled={creating}>
            {creating ? "Creating…" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
