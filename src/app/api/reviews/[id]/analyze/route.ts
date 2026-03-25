import type { AnalysisResult } from "@prisma/client";
import { NextResponse } from "next/server";
import { persistAnalysisForReview } from "@/lib/analyze-review-persist";
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

  const exists = await prisma.review.findUnique({
    where: { id: id.trim() },
    select: { id: true },
  });

  if (!exists) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  try {
    const analysis = await persistAnalysisForReview(id.trim());
    return NextResponse.json(analysis);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
