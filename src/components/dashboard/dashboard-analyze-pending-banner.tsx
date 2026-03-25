"use client";

import AutoAwesome from "@mui/icons-material/AutoAwesome";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { VISION } from "@/lib/vision-ui/colors";

const BATCH_LIMIT = 15;

type BatchResponse = {
  ok?: number;
  fail?: number;
  remaining?: number;
  sampleErrors?: string[];
  error?: string;
};

export function DashboardAnalyzePendingBanner({
  workspaceId,
  pendingCount,
  disabled,
}: {
  workspaceId: string | null;
  pendingCount: number;
  disabled: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [statusLine, setStatusLine] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAll = useCallback(async () => {
    if (!workspaceId || pendingCount <= 0 || disabled) return;
    setRunning(true);
    setError(null);
    let remaining = pendingCount;
    let totalOk = 0;
    let totalFail = 0;
    try {
      while (remaining > 0) {
        setStatusLine(`AI analysis running — about ${remaining} review(s) left…`);
        const res = await fetch("/api/workspaces/analyze-pending", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId, limit: BATCH_LIMIT }),
        });
        const data = (await res.json()) as BatchResponse;
        if (!res.ok) {
          setError(data.error ?? "Batch request failed");
          break;
        }
        const ok = data.ok ?? 0;
        const fail = data.fail ?? 0;
        totalOk += ok;
        totalFail += fail;
        remaining = data.remaining ?? 0;
        if (ok === 0 && fail > 0) {
          setError(
            (data.sampleErrors?.length ? data.sampleErrors.join(" · ") : null) ??
              "Could not analyze reviews (check OPENAI_API_KEY and quota).",
          );
          break;
        }
      }
      setStatusLine(
        totalFail > 0
          ? `Finished: ${totalOk} analyzed, ${totalFail} failed. Updating dashboard…`
          : `Finished: ${totalOk} analyzed. Updating dashboard…`,
      );
      router.refresh();
    } catch {
      setError("Network error — try again.");
    } finally {
      setRunning(false);
      window.setTimeout(() => setStatusLine(null), 5000);
    }
  }, [workspaceId, pendingCount, disabled, router]);

  if (!workspaceId || pendingCount <= 0 || disabled) {
    return null;
  }

  return (
    <Alert
      severity="info"
      variant="outlined"
      sx={{
        mb: 3,
        borderColor: "rgba(0, 117, 255, 0.45)",
        bgcolor: "rgba(0, 117, 255, 0.08)",
        color: "rgba(255,255,255,0.92)",
        "& .MuiAlert-icon": { color: VISION.info.main },
      }}
    >
      <Typography variant="subtitle2" fontWeight={700} sx={{ color: "#fff", mb: 0.5 }}>
        Charts need AI-analyzed reviews
      </Typography>
      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mb: 1.5 }}>
        You have{" "}
        <Typography component="span" fontWeight={700} sx={{ color: "#fff" }}>
          {pendingCount}
        </Typography>{" "}
        review(s) without analysis. Run batch analysis to fill sentiment trend and category
        charts (uses OpenAI; may take a few minutes for large backlogs).
      </Typography>
      {running ? (
        <Box sx={{ mb: 1 }}>
          <LinearProgress
            sx={{
              borderRadius: 1,
              height: 6,
              bgcolor: "rgba(255,255,255,0.08)",
              "& .MuiLinearProgress-bar": { bgcolor: VISION.info.main },
            }}
          />
        </Box>
      ) : null}
      {statusLine ? (
        <Typography variant="caption" sx={{ display: "block", color: VISION.text.main, mb: 1 }}>
          {statusLine}
        </Typography>
      ) : null}
      {error ? (
        <Typography variant="body2" sx={{ color: "error.light", mb: 1 }}>
          {error}
        </Typography>
      ) : null}
      <Button
        variant="contained"
        size="medium"
        disabled={running}
        startIcon={<AutoAwesome />}
        onClick={() => void runAll()}
        sx={{
          fontWeight: 700,
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        }}
      >
        {running ? "Working…" : `Analyze all pending (${pendingCount})`}
      </Button>
    </Alert>
  );
}
