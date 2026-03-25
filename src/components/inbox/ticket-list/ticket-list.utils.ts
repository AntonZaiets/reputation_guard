import type { InboxReview } from "@/types/inbox";
import {
  TICKET_LIST_DISPLAY_DATE_LOCALE,
  TICKET_LIST_SNIPPET_LEN,
} from "./ticket-list.constants";
import type { AnalyzeReviewApiResponse } from "./ticket-list.types";

export function ticketListSnippet(text: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= TICKET_LIST_SNIPPET_LEN) return t;
  return `${t.slice(0, TICKET_LIST_SNIPPET_LEN)}…`;
}

export function formatTicketListWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString(TICKET_LIST_DISPLAY_DATE_LOCALE, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function analysisFromAnalyzeApi(
  data: AnalyzeReviewApiResponse,
): NonNullable<InboxReview["analysis"]> | null {
  if (
    typeof data.id !== "string" ||
    typeof data.reviewId !== "string" ||
    typeof data.sentimentScore !== "number" ||
    typeof data.isCritical !== "boolean" ||
    typeof data.category !== "string" ||
    typeof data.summary !== "string" ||
    typeof data.createdAt !== "string"
  ) {
    return null;
  }
  return {
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
}
