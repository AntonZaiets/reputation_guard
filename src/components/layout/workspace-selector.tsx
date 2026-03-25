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
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const ADD_NEW_VALUE = "__add_new_company__";

export type WorkspaceListItem = {
  id: string;
  name: string;
};

type WorkspaceSelectorProps = {
  /** Workspace id the server used when the URL has no `workspaceId` query. */
  resolvedWorkspaceId: string | null;
};

export function WorkspaceSelector({ resolvedWorkspaceId }: WorkspaceSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pushWithWorkspace = (workspaceId: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("workspaceId", workspaceId);
    router.push(`${pathname}?${next.toString()}`);
  };
  const workspaceIdFromUrl = searchParams.get("workspaceId");

  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const effectiveWorkspaceId = useMemo(() => {
    const validIds = new Set(workspaces.map((w) => w.id));
    if (workspaces.length === 0) {
      return workspaceIdFromUrl ?? resolvedWorkspaceId ?? "";
    }
    if (workspaceIdFromUrl && validIds.has(workspaceIdFromUrl)) {
      return workspaceIdFromUrl;
    }
    if (resolvedWorkspaceId && validIds.has(resolvedWorkspaceId)) {
      return resolvedWorkspaceId;
    }
    return workspaces[0]?.id ?? "";
  }, [workspaces, workspaceIdFromUrl, resolvedWorkspaceId]);

  const refreshWorkspaces = useCallback(async () => {
    setLoadError(null);
    try {
      const res = await fetch("/api/workspaces");
      const data = (await res.json()) as unknown;
      if (!res.ok) {
        const err =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error: unknown }).error)
            : "Could not load companies";
        setLoadError(err);
        setWorkspaces([]);
        return;
      }
      if (!Array.isArray(data)) {
        setWorkspaces([]);
        return;
      }
      const list: WorkspaceListItem[] = [];
      for (const row of data) {
        if (
          typeof row === "object" &&
          row !== null &&
          "id" in row &&
          "name" in row &&
          typeof (row as { id: unknown }).id === "string" &&
          typeof (row as { name: unknown }).name === "string"
        ) {
          list.push({ id: (row as { id: string }).id, name: (row as { name: string }).name });
        }
      }
      setWorkspaces(list);
    } catch {
      setLoadError("Network error");
      setWorkspaces([]);
    }
  }, []);

  useEffect(() => {
    void refreshWorkspaces();
  }, [refreshWorkspaces]);

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    if (value === ADD_NEW_VALUE) {
      setCreateError(null);
      setNewCompanyName("");
      setAddOpen(true);
      return;
    }
    pushWithWorkspace(value);
  };

  const handleCloseAdd = () => {
    if (creating) return;
    setAddOpen(false);
    setNewCompanyName("");
    setCreateError(null);
  };

  const handleCreateCompany = async () => {
    const name = newCompanyName.trim();
    if (!name) {
      setCreateError("Enter a company name");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok) {
        setCreateError(data.error ?? "Could not create company");
        return;
      }
      if (typeof data.id !== "string") {
        setCreateError("Invalid response from server");
        return;
      }
      await refreshWorkspaces();
      setAddOpen(false);
      setNewCompanyName("");
      pushWithWorkspace(data.id);
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const selectedLabel =
    workspaces.find((w) => w.id === effectiveWorkspaceId)?.name ?? "";

  return (
    <>
      <Box sx={{ minWidth: { xs: "100%", sm: 260 }, maxWidth: 360 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 0.5, fontWeight: 600, letterSpacing: 0.4 }}
        >
          Current Company
        </Typography>
        <FormControl size="small" fullWidth disabled={Boolean(loadError) && workspaces.length === 0}>
          <InputLabel id="workspace-select-label">Company</InputLabel>
          <Select<string>
            labelId="workspace-select-label"
            id="workspace-select"
            label="Company"
            value={effectiveWorkspaceId}
            displayEmpty
            onChange={handleSelectChange}
            renderValue={(value) => {
              if (!value) {
                return (
                  <Typography variant="body2" color="text.secondary">
                    {workspaces.length === 0 ? "No companies yet" : "Select a company"}
                  </Typography>
                );
              }
              return selectedLabel || value;
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 320,
                  overflow: "auto",
                },
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
            <MenuItem
              value={ADD_NEW_VALUE}
              sx={{
                position: "sticky",
                bottom: 0,
                zIndex: 1,
                bgcolor: "background.paper",
                borderTop: 1,
                borderColor: "divider",
                gap: 1,
              }}
            >
              <AddBusinessOutlinedIcon fontSize="small" color="action" />
              <Typography variant="body2" fontWeight={600}>
                + Add New Company
              </Typography>
            </MenuItem>
          </Select>
        </FormControl>
        {loadError ? (
          <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
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
