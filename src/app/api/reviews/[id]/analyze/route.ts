import type { AnalysisResult } from "@prisma/client";
import { NextResponse } from "next/server";
import { analyzeReview } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(
  _request: Request,
  context: RouteParams,
): Promise<
  NextResponse<AnalysisResult | { error: string }>
> {
  const { id } = await context.params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing review id" }, { status: 400 });
  }

  const review = await prisma.review.findUnique({
    where: { id: id.trim() },
    select: { id: true, content: true },
  });

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  try {
    const ai = await analyzeReview(review.content);
    const analysis = await prisma.analysisResult.upsert({
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

    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
