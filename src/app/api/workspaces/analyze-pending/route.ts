import { NextResponse } from "next/server";
import { persistAnalysisForReview } from "@/lib/analyze-review-persist";
import { prisma } from "@/lib/prisma";

export const maxDuration = 120;

const MAX_BATCH = 15;
const CONCURRENCY = 2;

type Body = {
  workspaceId?: unknown;
  limit?: unknown;
};

export async function POST(request: Request): Promise<
  NextResponse<{
    ok: number;
    fail: number;
    remaining: number;
    sampleErrors: string[];
  } | { error: string }>
> {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const workspaceId =
    typeof body.workspaceId === "string" ? body.workspaceId.trim() : "";
  if (!workspaceId) {
    return NextResponse.json({ error: "workspaceId is required" }, { status: 400 });
  }

  const rawLimit = typeof body.limit === "number" ? body.limit : 20;
  const limit = Math.min(MAX_BATCH, Math.max(1, Math.floor(rawLimit)));

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { id: true },
  });
  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const pending = await prisma.review.findMany({
    where: {
      workspaceId,
      analysis: { is: null },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let ok = 0;
  let fail = 0;
  const sampleErrors: string[] = [];

  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const slice = pending.slice(i, i + CONCURRENCY);
    const outcomes = await Promise.all(
      slice.map(async ({ id }) => {
        try {
          await persistAnalysisForReview(id);
          return { success: true as const };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { success: false as const, id, msg };
        }
      }),
    );
    for (const o of outcomes) {
      if (o.success) ok += 1;
      else {
        fail += 1;
        if (sampleErrors.length < 5) {
          sampleErrors.push(`${o.id}: ${o.msg}`);
        }
      }
    }
  }

  const remaining = await prisma.review.count({
    where: { workspaceId, analysis: { is: null } },
  });

  return NextResponse.json({ ok, fail, remaining, sampleErrors });
}
