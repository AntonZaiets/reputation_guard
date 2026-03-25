"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CloseIcon from "@mui/icons-material/Close";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { InboxReview } from "@/types/inbox";

const SNIPPET_LEN = 140;

function snippet(text: string) {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= SNIPPET_LEN) return t;
  return `${t.slice(0, SNIPPET_LEN)}…`;
}

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export type TicketListProps = {
  reviews: InboxReview[];
};

export function TicketList({ reviews }: TicketListProps) {
  const [rows, setRows] = useState<InboxReview[]>(reviews);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });
  const [tooltipDraft, setTooltipDraft] = useState<string | null>(null);

  useEffect(() => {
    setRows(reviews);
  }, [reviews]);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const closeDetail = useCallback(() => setSelectedId(null), []);

  const runAnalyze = useCallback(async () => {
    if (!selected) return;
    const reviewId = selected.id;
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/analyze`, {
        method: "POST",
      });
      const data = (await res.json()) as {
        error?: string;
        id?: string;
        reviewId?: string;
        sentimentScore?: number;
        isCritical?: boolean;
        category?: string;
        summary?: string;
        draftEmpathetic?: string | null;
        draftOfficial?: string | null;
        draftAction?: string | null;
        createdAt?: string;
      };
      if (!res.ok) {
        setSnackbar({
          open: true,
          message: data.error ?? "Analysis failed",
          severity: "error",
        });
        return;
      }
      if (
        typeof data.id !== "string" ||
        typeof data.reviewId !== "string" ||
        typeof data.sentimentScore !== "number" ||
        typeof data.isCritical !== "boolean" ||
        typeof data.category !== "string" ||
        typeof data.summary !== "string" ||
        typeof data.createdAt !== "string"
      ) {
        setSnackbar({
          open: true,
          message: "Unexpected response from server",
          severity: "error",
        });
        return;
      }

      const nextAnalysis: NonNullable<InboxReview["analysis"]> = {
        id: data.id,
        reviewId: data.reviewId,
        sentimentScore: data.sentimentScore,
        isCritical: data.isCritical,
        category: data.category,
        summary: data.summary,
        draftEmpathetic: data.draftEmpathetic ?? null,
        draftOfficial: data.draftOfficial ?? null,
        draftAction: data.draftAction ?? null,
        createdAt: data.createdAt,
      };

      setRows((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, analysis: nextAnalysis } : r,
        ),
      );
      setSnackbar({
        open: true,
        message: "Analysis ready",
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Network error",
        severity: "error",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [selected]);

  const copyText = useCallback(async (text: string, draftKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setSnackbar({ open: true, message: "Copied!", severity: "success" });
      setTooltipDraft(draftKey);
      window.setTimeout(() => setTooltipDraft(null), 1500);
    } catch {
      setSnackbar({
        open: true,
        message: "Could not copy to clipboard",
        severity: "error",
      });
    }
  }, []);

  return (
    <Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}
      >
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Review</TableCell>
              <TableCell width={160}>Received</TableCell>
              <TableCell width={280}>Signals</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <Typography color="text.secondary" sx={{ py: 3 }} align="center">
                    No tickets yet. POST reviews to{" "}
                    <Typography component="span" variant="body2" fontFamily="monospace">
                      /api/reviews
                    </Typography>{" "}
                    to populate the inbox.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  onClick={() => setSelectedId(row.id)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {snippet(row.content)}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {row.source}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatWhen(row.createdAt)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" flexWrap="wrap" gap={0.75}>
                      <Chip
                        size="small"
                        label={row.analysis?.category ?? "No category"}
                        variant="outlined"
                      />
                      <Chip
                        size="small"
                        label={
                          row.analysis
                            ? `Sentiment ${row.analysis.sentimentScore}`
                            : "No score"
                        }
                        variant="filled"
                        sx={{
                          bgcolor: "primary.light",
                          color: "primary.contrastText",
                        }}
                      />
                      {row.analysis?.isCritical ? (
                        <Chip size="small" label="Critical" color="error" />
                      ) : null}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Drawer
        anchor="right"
        open={selected != null}
        onClose={closeDetail}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 480, md: 560 },
              maxWidth: "100vw",
            },
          },
        }}
      >
        {selected ? (
          <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography variant="h6" component="h2" fontWeight={600}>
                Reply builder
              </Typography>
              <IconButton edge="end" onClick={closeDetail} aria-label="close">
                <CloseIcon />
              </IconButton>
            </Stack>

            <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
              <Typography variant="overline" color="text.secondary">
                Original review
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, whiteSpace: "pre-wrap" }}>
                {selected.content}
              </Typography>
              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                <Chip size="small" label={selected.source} variant="outlined" />
                <Chip size="small" label={formatWhen(selected.createdAt)} variant="outlined" />
              </Stack>

              <Typography variant="overline" color="text.secondary" sx={{ mt: 3, display: "block" }}>
                AI summary
              </Typography>
              <Typography variant="body2" sx={{ mt: 0.5 }}>
                {selected.analysis?.summary ??
                  "Run analysis to generate a summary and reply drafts."}
              </Typography>

              <Typography variant="h6" sx={{ mt: 3, mb: 1.5 }} fontWeight={600}>
                AI suggested replies
              </Typography>

              {!selected.analysis ? (
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={isAnalyzing}
                  onClick={() => void runAnalyze()}
                  startIcon={
                    isAnalyzing ? (
                      <CircularProgress size={22} color="inherit" aria-label="Analyzing" />
                    ) : (
                      <AutoAwesomeIcon />
                    )
                  }
                  sx={{
                    py: 2,
                    borderRadius: 2,
                    fontWeight: 700,
                    fontSize: "1rem",
                    boxShadow: 2,
                  }}
                >
                  {isAnalyzing ? "Analyzing…" : "Ask AI to Analyze & Reply"}
                </Button>
              ) : (
                <Stack spacing={2}>
                  <DraftCard
                    title="Empathetic"
                    subtitle="Apologies and understanding"
                    text={selected.analysis.draftEmpathetic}
                    copyKey="empathetic"
                    tooltipDraft={tooltipDraft}
                    onCopy={copyText}
                  />
                  <DraftCard
                    title="Official"
                    subtitle="Professional and concise"
                    text={selected.analysis.draftOfficial}
                    copyKey="official"
                    tooltipDraft={tooltipDraft}
                    onCopy={copyText}
                  />
                  <DraftCard
                    title="Action-oriented"
                    subtitle="Troubleshooting and next steps"
                    text={selected.analysis.draftAction}
                    copyKey="action"
                    tooltipDraft={tooltipDraft}
                    onCopy={copyText}
                  />
                </Stack>
              )}
            </Box>
          </Box>
        ) : null}
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2200}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function DraftCard({
  title,
  subtitle,
  text,
  copyKey,
  tooltipDraft,
  onCopy,
}: {
  title: string;
  subtitle: string;
  text: string | null;
  copyKey: string;
  tooltipDraft: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  const body = text?.trim() || "No draft generated.";
  const canCopy = Boolean(text?.trim());

  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardHeader
        title={title}
        subheader={subtitle}
        action={
          <Tooltip
            open={tooltipDraft === copyKey}
            title="Copied!"
            placement="left"
            disableFocusListener
            disableTouchListener
          >
            <span>
              <IconButton
                size="small"
                aria-label={`Copy ${title} draft`}
                disabled={!canCopy}
                onClick={() => canCopy && text && onCopy(text, copyKey)}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        }
        titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
        subheaderTypographyProps={{ variant: "caption" }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
          {body}
        </Typography>
      </CardContent>
    </Card>
  );
}
