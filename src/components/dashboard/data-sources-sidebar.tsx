"use client";

import AppleIcon from "@mui/icons-material/Apple";
import AndroidIcon from "@mui/icons-material/Android";
import StarIcon from "@mui/icons-material/Star";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { DataSourceId } from "@/lib/data-sources";

const SOURCE_OPTIONS: {
  id: DataSourceId;
  label: string;
  Icon: typeof AndroidIcon;
}[] = [
  { id: "play_store", label: "Play Store", Icon: AndroidIcon },
  { id: "app_store", label: "App Store", Icon: AppleIcon },
  { id: "trustpilot", label: "Trustpilot", Icon: StarIcon },
];

const SIDEBAR_WIDTH = 320;

const checkedPaperSx = {
  bgcolor: "rgba(200, 230, 201, 0.45)",
  borderColor: "success.light",
  borderWidth: 1,
  borderStyle: "solid",
};

const uncheckedPaperSx = {
  bgcolor: "grey.50",
  borderColor: "divider",
  borderWidth: 1,
  borderStyle: "solid",
};

export type DataSourcesSidebarProps = {
  workspaceId: string | null;
  initialBrandKeyword: string | null;
  initialActiveSources: string[];
  disabled?: boolean;
};

export function DataSourcesSidebar({
  workspaceId,
  initialBrandKeyword,
  initialActiveSources,
  disabled = false,
}: DataSourcesSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const workspaceIdFromUrl = searchParams.get("workspaceId")?.trim() ?? "";
  /** Prefer `?workspaceId=` so sync/save match the company shown in the URL and selector. */
  const apiWorkspaceId =
    workspaceIdFromUrl.length > 0 ? workspaceIdFromUrl : (workspaceId ?? "");

  const [brandKeyword, setBrandKeyword] = useState(initialBrandKeyword ?? "");
  const [selected, setSelected] = useState<Set<DataSourceId>>(() => {
    const next = new Set<DataSourceId>();
    for (const id of initialActiveSources) {
      if (SOURCE_OPTIONS.some((o) => o.id === id)) {
        next.add(id as DataSourceId);
      }
    }
    return next;
  });
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; ok: boolean }>({
    open: false,
    message: "",
    ok: true,
  });

  useEffect(() => {
    setBrandKeyword(initialBrandKeyword ?? "");
    setSelected(() => {
      const next = new Set<DataSourceId>();
      for (const id of initialActiveSources) {
        if (SOURCE_OPTIONS.some((o) => o.id === id)) {
          next.add(id as DataSourceId);
        }
      }
      return next;
    });
  }, [workspaceId, initialBrandKeyword, initialActiveSources]);

  useEffect(() => {
    if (!workspaceIdFromUrl || workspaceIdFromUrl === workspaceId) {
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch("/api/workspaces");
        const data = (await res.json()) as unknown;
        if (!Array.isArray(data) || cancelled) return;
        for (const row of data) {
          if (
            typeof row !== "object" ||
            row === null ||
            !("id" in row) ||
            (row as { id: unknown }).id !== workspaceIdFromUrl
          ) {
            continue;
          }
          const w = row as {
            brandKeyword?: string | null;
            activeSources?: unknown;
          };
          if (cancelled) return;
          setBrandKeyword(w.brandKeyword ?? "");
          setSelected(() => {
            const next = new Set<DataSourceId>();
            const sources = w.activeSources;
            if (Array.isArray(sources)) {
              for (const id of sources) {
                if (typeof id === "string" && SOURCE_OPTIONS.some((o) => o.id === id)) {
                  next.add(id as DataSourceId);
                }
              }
            }
            return next;
          });
          return;
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [workspaceIdFromUrl, workspaceId]);

  const toggleSource = useCallback((id: DataSourceId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleApply = async () => {
    if (!apiWorkspaceId || disabled) return;
    setSaving(true);
    try {
      const res = await fetch("/api/workspaces", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: apiWorkspaceId,
          brandKeyword: brandKeyword.trim() === "" ? null : brandKeyword.trim(),
          activeSources: [...selected],
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setSnackbar({
          open: true,
          message: data.error ?? "Could not save settings",
          ok: false,
        });
        return;
      }
      setSnackbar({ open: true, message: "Changes saved", ok: true });
      router.refresh();
    } catch {
      setSnackbar({ open: true, message: "Network error", ok: false });
    } finally {
      setSaving(false);
    }
  };

  const handleSyncReviews = async () => {
    if (!apiWorkspaceId || disabled) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/sync-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: apiWorkspaceId,
          brandKeyword: brandKeyword.trim() === "" ? null : brandKeyword.trim(),
          activeSources: [...selected],
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        imported?: number;
        warnings?: string[];
      };
      if (!res.ok) {
        setSnackbar({
          open: true,
          message: data.error ?? "Sync failed",
          ok: false,
        });
        return;
      }
      setSnackbar({
        open: true,
        message: data.message ?? `Imported ${data.imported ?? 0} review(s).`,
        ok: true,
      });
      router.refresh();
    } catch {
      setSnackbar({ open: true, message: "Network error", ok: false });
    } finally {
      setSyncing(false);
    }
  };

  const formDisabled = disabled || !apiWorkspaceId;

  return (
    <Box
      component="aside"
      sx={{
        width: SIDEBAR_WIDTH,
        flexShrink: 0,
        bgcolor: "background.paper",
        borderLeft: 1,
        borderColor: "divider",
        px: 2.5,
        py: 3,
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <Typography variant="h6" fontWeight={700}>
        Data Sources
      </Typography>

      <TextField
        label="Brand Name (Keyword)"
        value={brandKeyword}
        onChange={(e) => setBrandKeyword(e.target.value)}
        fullWidth
        variant="outlined"
        size="small"
        disabled={formDisabled}
      />

      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {SOURCE_OPTIONS.map(({ id, label, Icon }) => {
          const checked = selected.has(id);
          return (
            <Paper
              key={id}
              elevation={0}
              sx={{
                px: 1,
                py: 0.5,
                borderRadius: 2,
                transition: "background-color 0.15s ease, border-color 0.15s ease",
                ...(checked ? checkedPaperSx : uncheckedPaperSx),
              }}
            >
              <FormControlLabel
                control={
                  <Checkbox
                    checked={checked}
                    onChange={() => toggleSource(id)}
                    disabled={formDisabled}
                    size="small"
                  />
                }
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Icon fontSize="small" color="action" />
                    <Typography variant="body2">{label}</Typography>
                  </Box>
                }
                sx={{ m: 0, width: "100%", mr: 0 }}
              />
            </Paper>
          );
        })}
      </Box>

      <Box sx={{ mt: "auto", pt: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <Button
          variant="contained"
          fullWidth
          disabled={formDisabled || saving}
          onClick={() => void handleApply()}
          sx={{
            borderRadius: 2,
            py: 1.25,
            bgcolor: "#94a3b8",
            color: "common.white",
            boxShadow: "none",
            "&:hover": {
              bgcolor: "#7c8ca0",
              boxShadow: "none",
            },
            "&.Mui-disabled": {
              bgcolor: "action.disabledBackground",
              color: "action.disabled",
            },
          }}
        >
          {saving ? "Saving…" : "Apply Changes"}
        </Button>
        <Button
          variant="contained"
          fullWidth
          disabled={formDisabled || syncing}
          onClick={() => void handleSyncReviews()}
          startIcon={
            syncing ? (
              <CircularProgress size={18} color="inherit" aria-label="Syncing" />
            ) : null
          }
          sx={{
            borderRadius: 2,
            py: 1.35,
            fontWeight: 700,
            boxShadow: "none",
            "&:hover": { boxShadow: "none" },
          }}
        >
          {syncing ? "Syncing…" : "Sync Latest Reviews"}
        </Button>
      </Box>

      {!apiWorkspaceId && !disabled ? (
        <Alert severity="info" sx={{ mt: 1 }}>
          Create a workspace in the database to enable data source settings.
        </Alert>
      ) : null}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.ok ? "success" : "error"}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
