import { NextResponse } from "next/server";
import { isDataSourceId } from "@/lib/data-sources";
import {
  collectExternalReviewRows,
  persistExternalReviewRows,
} from "@/lib/sync-external-reviews";
import { prisma } from "@/lib/prisma";

type Body = {
  workspaceId?: unknown;
  /** When sent (e.g. from Data Sources sidebar), used for scraping and saved to the workspace. */
  brandKeyword?: unknown;
  activeSources?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isValidActiveSourcesPayload(v: unknown): v is string[] {
  if (!Array.isArray(v)) return false;
  return v.every((item) => typeof item === "string" && isDataSourceId(item));
}

export async function POST(
  request: Request,
): Promise<
  NextResponse<
    | { ok: true; imported: number; warnings: string[]; message: string }
    | { error: string }
  >
> {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isNonEmptyString(body.workspaceId)) {
    return NextResponse.json(
      { error: "Body must include a non-empty string workspaceId" },
      { status: 400 },
    );
  }

  const workspaceId = body.workspaceId.trim();

  try {
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: { id: true, brandKeyword: true, activeSources: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    const clientSentSources = "activeSources" in body;
    if (clientSentSources && !isValidActiveSourcesPayload(body.activeSources)) {
      return NextResponse.json(
        { error: "activeSources must be an array of play_store, app_store, trustpilot" },
        { status: 400 },
      );
    }

    const clientSentKeyword = "brandKeyword" in body;
    if (
      clientSentKeyword &&
      body.brandKeyword !== null &&
      typeof body.brandKeyword !== "string"
    ) {
      return NextResponse.json(
        { error: "brandKeyword must be a string, null, or omitted" },
        { status: 400 },
      );
    }

    const activeSources = clientSentSources
      ? [...new Set(body.activeSources as string[])]
      : workspace.activeSources;

    const brandKeyword = clientSentKeyword
      ? body.brandKeyword === null || String(body.brandKeyword).trim() === ""
        ? null
        : String(body.brandKeyword).trim()
      : workspace.brandKeyword;

    if (clientSentSources || clientSentKeyword) {
      await prisma.workspace.update({
        where: { id: workspace.id },
        data: {
          ...(clientSentSources ? { activeSources } : {}),
          ...(clientSentKeyword ? { brandKeyword } : {}),
        },
      });
    }

    const { rows, warnings } = await collectExternalReviewRows({
      brandKeyword,
      activeSources,
    });

    const imported = await persistExternalReviewRows(prisma, workspace.id, rows);

    if (process.env.REPUTATION_GUARD_SYNC_DEBUG === "1") {
      console.log("[reputation-guard:sync] DB import", {
        workspaceId: workspace.id,
        scrapedRows: rows.length,
        inserted: imported,
      });
    }

    const outWarnings = [...warnings];
    if (rows.length > 0 && imported === 0) {
      outWarnings.push(
        `${rows.length} review(s) fetched but all were already imported (same source + text).`,
      );
    }

    const message =
      outWarnings.length > 0
        ? `Imported ${imported} new review(s). ${outWarnings.join(" ")}`
        : `Imported ${imported} new review(s).`;

    return NextResponse.json({
      ok: true,
      imported,
      warnings: outWarnings,
      message,
    });
  } catch (err) {
    console.error("[sync-reviews]", err);
    const message = err instanceof Error ? err.message : "Sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
