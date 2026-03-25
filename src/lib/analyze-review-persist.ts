import type { AnalysisResult } from "@prisma/client";
import { analyzeReview } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

export async function persistAnalysisForReview(reviewId: string): Promise<AnalysisResult> {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, content: true },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  const ai = await analyzeReview(review.content);

  return prisma.analysisResult.upsert({
    where: { reviewId: review.id },
    create: {
      reviewId: review.id,
      sentimentScore: ai.sentimentScore,
      isCritical: ai.isCritical,
      category: ai.category,
      summary: ai.summary,
      draftEmpathetic: ai.drafts.empathetic,
      draftOfficial: ai.drafts.official,
      draftAction: ai.drafts.action_oriented,
    },
    update: {
      sentimentScore: ai.sentimentScore,
      isCritical: ai.isCritical,
      category: ai.category,
      summary: ai.summary,
      draftEmpathetic: ai.drafts.empathetic,
      draftOfficial: ai.drafts.official,
      draftAction: ai.drafts.action_oriented,
    },
  });
}
