"use client";

import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import CloseIcon from "@mui/icons-material/Close";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
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
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { InboxReview } from "@/types/inbox";
import { DraftCard } from "@/components/molecules/draft-card/draft-card";
import {
  ticketListAiSummarySx,
  ticketListAnalyzeButtonSx,
  ticketListDetailHeaderSx,
  ticketListDetailRootSx,
  ticketListDetailScrollSx,
  ticketListDrawerPaperSx,
  ticketListEmptyStateTypographySx,
  ticketListRepliesTitleSx,
  ticketListReviewBodySx,
  ticketListRowSx,
  ticketListSectionOverlineSx,
  ticketListSentimentChipSx,
  ticketListSnackbarAlertSx,
  ticketListTableContainerSx,
  ticketListTableSx,
} from "./ticket-list.styles";
import type { TicketListProps } from "./ticket-list.types";
import {
  formatTicketListWhen,
  ticketListSnippet,
} from "./ticket-list.utils";
import { useTicketListActions } from "./use-ticket-list-actions";

export function TicketList({ reviews }: TicketListProps) {
  const [rows, setRows] = useState<InboxReview[]>(reviews);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setRows(reviews);
  }, [reviews]);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const closeDetail = useCallback(() => setSelectedId(null), []);

  const {
    runAnalyze,
    copyText,
    isAnalyzing,
    snackbar,
    dismissSnackbar,
    tooltipDraft,
  } = useTicketListActions(selected, setRows);

  return (
    <Box>
      <TableContainer
        component={Paper}
        elevation={0}
        sx={ticketListTableContainerSx}
      >
        <Table size="small" sx={ticketListTableSx}>
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
                  <Typography
                    color="text.secondary"
                    sx={ticketListEmptyStateTypographySx}
                    align="center"
                  >
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
                  sx={ticketListRowSx}
                >
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {ticketListSnippet(row.content)}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {row.source}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatTicketListWhen(row.createdAt)}</Typography>
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
                        sx={ticketListSentimentChipSx}
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
            sx: ticketListDrawerPaperSx,
          },
        }}
      >
        {selected ? (
          <Box sx={ticketListDetailRootSx}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={ticketListDetailHeaderSx}
            >
              <Typography variant="h6" component="h2" fontWeight={600}>
                Reply builder
              </Typography>
              <IconButton edge="end" onClick={closeDetail} aria-label="close">
                <CloseIcon />
              </IconButton>
            </Stack>

            <Box sx={ticketListDetailScrollSx}>
              <Typography variant="overline" color="text.secondary">
                Original review
              </Typography>
              <Typography variant="body1" sx={ticketListReviewBodySx}>
                {selected.content}
              </Typography>
              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 1.5 }}>
                <Chip size="small" label={selected.source} variant="outlined" />
                <Chip
                  size="small"
                  label={formatTicketListWhen(selected.createdAt)}
                  variant="outlined"
                />
              </Stack>

              <Typography variant="overline" color="text.secondary" sx={ticketListSectionOverlineSx}>
                AI summary
              </Typography>
              <Typography variant="body2" sx={ticketListAiSummarySx}>
                {selected.analysis?.summary ??
                  "Run analysis to generate a summary and reply drafts."}
              </Typography>

              <Typography variant="h6" sx={ticketListRepliesTitleSx} fontWeight={600}>
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
                  sx={ticketListAnalyzeButtonSx}
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
        onClose={dismissSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={dismissSnackbar}
          severity={snackbar.severity}
          variant="filled"
          sx={ticketListSnackbarAlertSx}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
