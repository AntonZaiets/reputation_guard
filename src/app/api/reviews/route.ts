import type { AnalysisResult, Review } from "@prisma/client";
import { NextResponse } from "next/server";
import { analyzeReview } from "@/lib/ai";
import { prisma } from "@/lib/prisma";

type CreateReviewBody = {
  content?: unknown;
  source?: unknown;
  workspaceId?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export type CreateReviewResponse = {
  review: Review;
  analysis: AnalysisResult;
};

export async function POST(request: Request): Promise<NextResponse<CreateReviewResponse | { error: string }>> {
  let body: CreateReviewBody;
  try {
    body = (await request.json()) as CreateReviewBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { content, source, workspaceId } = body;
  if (!isNonEmptyString(content) || !isNonEmptyString(source) || !isNonEmptyString(workspaceId)) {
    return NextResponse.json(
      { error: "Body must include non-empty strings: content, source, workspaceId" },
      { status: 400 },
    );
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId.trim() },
    select: { id: true },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const review = await prisma.review.create({
    data: {
      content: content.trim(),
      source: source.trim(),
      workspaceId: workspace.id,
    },
  });

  try {
    const ai = await analyzeReview(review.content);
    const analysis = await prisma.analysisResult.create({
      data: {
        reviewId: review.id,
        sentimentScore: ai.sentimentScore,
        isCritical: ai.isCritical,
        category: ai.category,
        summary: ai.summary,
        draftEmpathetic: ai.drafts.empathetic,
        draftOfficial: ai.drafts.official,
        draftAction: ai.drafts.action_oriented,
      },
    });

    return NextResponse.json({ review, analysis }, { status: 201 });
  } catch (err) {
    await prisma.review.delete({ where: { id: review.id } }).catch(() => {});
    const message = err instanceof Error ? err.message : "Failed to analyze review";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
