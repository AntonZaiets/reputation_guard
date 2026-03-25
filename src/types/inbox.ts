import type { AnalysisResult, Review } from "@prisma/client";

/** Shape passed from Server Component after JSON serialization (dates → strings). */
export type InboxReview = Omit<Review, "createdAt"> & {
  createdAt: string;
  analysis: Omit<AnalysisResult, "createdAt"> & { createdAt: string } | null;
};
