import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { InboxReview } from "@/types/inbox";
import { analysisFromAnalyzeApi } from "./ticket-list.utils";
import type {
  AnalyzeReviewApiResponse,
  TicketListSnackbarState,
} from "./ticket-list.types";

const initialSnackbar: TicketListSnackbarState = {
  open: false,
  message: "",
  severity: "success",
};

export function useTicketListActions(
  selected: InboxReview | null,
  setRows: Dispatch<SetStateAction<InboxReview[]>>,
) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [snackbar, setSnackbar] = useState<TicketListSnackbarState>(initialSnackbar);
  const [tooltipDraft, setTooltipDraft] = useState<string | null>(null);

  const runAnalyze = useCallback(async () => {
    if (!selected) return;
    const reviewId = selected.id;
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/analyze`, {
        method: "POST",
      });
      const data = (await res.json()) as AnalyzeReviewApiResponse;
      if (!res.ok) {
        setSnackbar({
          open: true,
          message: data.error ?? "Analysis failed",
          severity: "error",
        });
        return;
      }
      const nextAnalysis = analysisFromAnalyzeApi(data);
      if (!nextAnalysis) {
        setSnackbar({
          open: true,
          message: "Unexpected response from server",
          severity: "error",
        });
        return;
      }

      setRows((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, analysis: nextAnalysis } : r)),
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
  }, [selected, setRows]);

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

  const dismissSnackbar = useCallback(() => {
    setSnackbar((s) => ({ ...s, open: false }));
  }, []);

  return {
    runAnalyze,
    copyText,
    isAnalyzing,
    snackbar,
    dismissSnackbar,
    tooltipDraft,
  };
}
