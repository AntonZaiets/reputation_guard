import type { InboxReview } from "@/types/inbox";

export type TicketListProps = {
  reviews: InboxReview[];
  /** Dark glass table (home shell). Default keeps light surfaces for other routes. */
  visualVariant?: "light" | "dark";
};

export type TicketListSnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

/** Shape returned by POST /api/reviews/:id/analyze (JSON). */
export type AnalyzeReviewApiResponse = {
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
