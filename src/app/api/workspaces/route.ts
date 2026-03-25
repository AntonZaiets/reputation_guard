import { NextResponse } from "next/server";
import { DATA_SOURCE_IDS, isDataSourceId } from "@/lib/data-sources";
import { prisma } from "@/lib/prisma";

export async function GET(): Promise<NextResponse<unknown>> {
  const workspaces = await prisma.workspace.findMany({
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(workspaces);
}

type PostBody = {
  name?: unknown;
};

export async function POST(
  request: Request,
): Promise<NextResponse<unknown>> {
  let body: PostBody;
  try {
    body = (await request.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = body.name;
  if (typeof name !== "string" || name.trim().length === 0) {
    return NextResponse.json(
      { error: "Body must include a non-empty string name" },
      { status: 400 },
    );
  }

  const workspace = await prisma.workspace.create({
    data: { name: name.trim() },
  });

  return NextResponse.json(workspace);
}

type PatchBody = {
  workspaceId?: unknown;
  brandKeyword?: unknown;
  activeSources?: unknown;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function isStringOrNull(v: unknown): v is string | null {
  return v === null || typeof v === "string";
}

function isValidActiveSources(v: unknown): v is string[] {
  if (!Array.isArray(v)) return false;
  return v.every((item) => typeof item === "string" && isDataSourceId(item));
}

export async function PATCH(
  request: Request,
): Promise<
  NextResponse<
    | { id: string; brandKeyword: string | null; activeSources: string[] }
    | { error: string }
  >
> {
  let body: PatchBody;
  try {
    body = (await request.json()) as PatchBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { workspaceId, brandKeyword, activeSources } = body;

  if (!isNonEmptyString(workspaceId)) {
    return NextResponse.json(
      { error: "Body must include a non-empty string workspaceId" },
      { status: 400 },
    );
  }

  if (brandKeyword !== undefined && !isStringOrNull(brandKeyword)) {
    return NextResponse.json(
      { error: "brandKeyword must be a string or null when provided" },
      { status: 400 },
    );
  }

  if (activeSources === undefined) {
    return NextResponse.json(
      { error: "Body must include activeSources (array of platform ids)" },
      { status: 400 },
    );
  }

  if (!isValidActiveSources(activeSources)) {
    return NextResponse.json(
      {
        error: `activeSources must be an array of: ${DATA_SOURCE_IDS.join(", ")}`,
      },
      { status: 400 },
    );
  }

  const uniqueActiveSources = [...new Set(activeSources)];

  const existing = await prisma.workspace.findUnique({
    where: { id: workspaceId.trim() },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  const data: { brandKeyword?: string | null; activeSources: string[] } = {
    activeSources: uniqueActiveSources,
  };
  if (brandKeyword !== undefined) {
    data.brandKeyword =
      brandKeyword === null || brandKeyword.trim() === "" ? null : brandKeyword.trim();
  }

  const updated = await prisma.workspace.update({
    where: { id: existing.id },
    data,
    select: {
      id: true,
      brandKeyword: true,
      activeSources: true,
    },
  });

  return NextResponse.json({
    id: updated.id,
    brandKeyword: updated.brandKeyword,
    activeSources: updated.activeSources,
  });
}
