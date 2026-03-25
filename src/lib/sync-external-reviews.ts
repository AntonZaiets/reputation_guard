import type { PrismaClient } from "@prisma/client";
import appStore from "app-store-scraper";
import { DATA_SOURCE_IDS } from "@/lib/data-sources";

function syncDebug(message: string, data?: unknown): void {
  if (process.env.REPUTATION_GUARD_SYNC_DEBUG !== "1") return;
  if (data !== undefined) {
    console.log(`[reputation-guard:sync] ${message}`, data);
  } else {
    console.log(`[reputation-guard:sync] ${message}`);
  }
}

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

const PLAY_STORE_REVIEW_TARGET = () =>
  intEnv("REPUTATION_GUARD_SYNC_PLAY_NUM", 500);

const APP_STORE_REVIEW_PAGES = () =>
  Math.min(10, intEnv("REPUTATION_GUARD_SYNC_APP_PAGES", 10));

const TRUSTPILOT_REVIEW_MAX = () =>
  intEnv("REPUTATION_GUARD_SYNC_TRUSTPILOT_MAX", 200);

export const SOURCE_PLAY_STORE = "Play Store";
export const SOURCE_APP_STORE = "App Store";
export const SOURCE_TRUSTPILOT = "Trustpilot";

type ScrapedRow = {
  source: string;
  content: string;
  authorId: string | null;
  createdAt?: Date;
};

type GplayReview = {
  id?: string;
  userName?: string;
  text?: string | null;
  date?: Date | string | number | null;
};

type AppStoreReview = {
  id?: string;
  userName?: string;
  text?: string;
  updated?: string;
};

async function fetchPlayStoreReviews(appId: string, num: number): Promise<ScrapedRow[]> {
  const gplay = (await import("google-play-scraper")).default;
  const result = await gplay.reviews({
    appId: appId.trim(),
    sort: gplay.sort.NEWEST,
    num,
  });
  const data = (result as { data?: GplayReview[] }).data ?? [];
  const rows: ScrapedRow[] = [];

  for (const r of data) {
    const text = typeof r.text === "string" ? r.text.trim() : "";
    if (!text) continue;
    let createdAt: Date | undefined;
    if (r.date != null) {
      const d =
        r.date instanceof Date
          ? r.date
          : typeof r.date === "number"
            ? new Date(r.date)
            : new Date(String(r.date));
      if (!Number.isNaN(d.getTime())) createdAt = d;
    }
    rows.push({
      source: SOURCE_PLAY_STORE,
      content: text,
      authorId: r.id != null ? String(r.id) : r.userName ?? null,
      createdAt,
    });
  }

  return rows;
}

async function fetchAppStoreReviewsResolved(
  opts: { id: number } | { appId: string },
): Promise<ScrapedRow[]> {
  const maxPages = APP_STORE_REVIEW_PAGES();
  const rows: ScrapedRow[] = [];
  const seenIds = new Set<string>();

  for (let page = 1; page <= maxPages; page++) {
    let list: AppStoreReview[];
    try {
      list = (await appStore.reviews({
        ...opts,
        sort: appStore.sort.RECENT,
        page,
      })) as AppStoreReview[];
    } catch {
      break;
    }

    if (!Array.isArray(list) || list.length === 0) break;

    let newOnPage = 0;
    for (const r of list) {
      const rid = r.id != null ? String(r.id) : "";
      if (rid && seenIds.has(rid)) continue;

      const text = typeof r.text === "string" ? r.text.trim() : "";
      if (!text) continue;

      let createdAt: Date | undefined;
      if (typeof r.updated === "string") {
        const d = new Date(r.updated);
        if (!Number.isNaN(d.getTime())) createdAt = d;
      }
      if (rid) seenIds.add(rid);
      newOnPage += 1;
      rows.push({
        source: SOURCE_APP_STORE,
        content: text,
        authorId: r.id != null ? String(r.id) : r.userName ?? null,
        createdAt,
      });
    }

    if (newOnPage === 0) break;
  }

  return rows;
}

/** Trustpilot `/review/{slug}`: full domain, or brand without "." → try `.com.ua` then `.com`. */
function trustpilotDomainCandidates(raw: string): string[] {
  let d = raw.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, "");
  const slash = d.indexOf("/");
  if (slash >= 0) d = d.slice(0, slash);
  if (!d) return [];
  if (d.includes(".")) return [d];
  return [`${d}.com.ua`, `${d}.com`];
}

async function scrapeTrustpilotWithDomainFallback(
  keyword: string,
  max: number,
): Promise<{ rows: ScrapedRow[]; warnings: string[] }> {
  const candidates = trustpilotDomainCandidates(keyword);
  const warnings: string[] = [];
  if (candidates.length === 0) {
    return { rows: [], warnings: ["Trustpilot skipped: brand keyword is empty."] };
  }

  const { fetchTrustpilotReviewsFromHtml } = await import("@/lib/scrapers/trustpilot-html");
  const rows: ScrapedRow[] = [];
  let lastError: string | null = null;

  for (const domain of candidates) {
    try {
      const tp = await fetchTrustpilotReviewsFromHtml(domain, max);
      if (tp.length > 0) {
        for (const r of tp) {
          rows.push({
            source: SOURCE_TRUSTPILOT,
            content: r.text,
            authorId: r.authorId,
            createdAt: r.createdAt ?? undefined,
          });
        }
        return { rows, warnings };
      }
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      continue;
    }
  }

  if (lastError) {
    warnings.push(`Trustpilot: ${lastError}`);
  } else {
    warnings.push(
      `Trustpilot: no reviews found (tried ${candidates.join(", ")}).`,
    );
  }
  return { rows, warnings };
}

export type CollectExternalReviewsInput = {
  brandKeyword: string | null;
  activeSources: string[];
};

export type CollectExternalReviewsResult = {
  rows: ScrapedRow[];
  warnings: string[];
};

/**
 * Fetches reviews from external sources (network I/O). Run this outside of a DB transaction
 * so Prisma does not hold a transaction open during slow scrapes.
 */
export async function collectExternalReviewRows(
  input: CollectExternalReviewsInput,
): Promise<CollectExternalReviewsResult> {
  const { brandKeyword, activeSources } = input;
  const keyword = brandKeyword?.trim() ?? "";
  const warnings: string[] = [];
  const pending: ScrapedRow[] = [];

  const enabledPlatforms = DATA_SOURCE_IDS.filter((id) => activeSources.includes(id));
  if (enabledPlatforms.length === 0) {
    return {
      rows: [],
      warnings: [
        "No platforms saved for this workspace. Select Play Store, App Store, and/or Trustpilot, then click Apply Changes before syncing.",
      ],
    };
  }

  if (!keyword) {
    return {
      rows: [],
      warnings: [
        "Brand keyword is empty. Enter a search term and click Apply Changes before syncing.",
      ],
    };
  }

  if (activeSources.includes("play_store")) {
    let searchHits: { appId?: string }[] | null = null;
      try {
        const gplay = (await import("google-play-scraper")).default;
        searchHits = await gplay.search({ term: keyword, num: 1 });
      } catch (e) {
        warnings.push(
          `Play Store (search): ${e instanceof Error ? e.message : String(e)}`,
        );
      }

      if (searchHits !== null) {
        if (!Array.isArray(searchHits) || searchHits.length === 0) {
          warnings.push(
            `Play Store: no search results for "${keyword}".`,
          );
        } else {
          const appId = searchHits[0]?.appId;
          if (typeof appId !== "string" || !appId.trim()) {
            warnings.push("Play Store: top search result had no appId.");
          } else {
            try {
              const playRows = await fetchPlayStoreReviews(
                appId.trim(),
                PLAY_STORE_REVIEW_TARGET(),
              );
              if (playRows.length === 0) {
                warnings.push(
                  `Play Store: no review text for resolved app "${appId.trim()}" (store may have changed or the app has no reviews).`,
                );
              } else {
                syncDebug(`Play Store: ${playRows.length} row(s)`, {
                  appId: appId.trim(),
                  targetNum: PLAY_STORE_REVIEW_TARGET(),
                });
                pending.push(...playRows);
              }
            } catch (e) {
              warnings.push(
                `Play Store (reviews): ${e instanceof Error ? e.message : String(e)}`,
              );
            }
          }
        }
      }
  }

  if (activeSources.includes("app_store")) {
    let searchHits: { id?: number | string; appId?: string }[] | null = null;
      try {
        searchHits = await appStore.search({ term: keyword, num: 1 });
      } catch (e) {
        warnings.push(
          `App Store (search): ${e instanceof Error ? e.message : String(e)}`,
        );
      }

      if (searchHits !== null) {
        if (!Array.isArray(searchHits) || searchHits.length === 0) {
          warnings.push(
            `App Store: no search results for "${keyword}".`,
          );
        } else {
          const first = searchHits[0];
          const rawId = first?.id;
          const trackId =
            typeof rawId === "number" && !Number.isNaN(rawId)
              ? rawId
              : typeof rawId === "string" && /^\d+$/.test(rawId.trim())
                ? Number(rawId.trim())
                : undefined;
          const bundleId =
            typeof first?.appId === "string" && first.appId.trim()
              ? first.appId.trim()
              : undefined;

          if (trackId === undefined && !bundleId) {
            warnings.push(
              "App Store: top search result had no id or appId.",
            );
          } else {
            try {
              const resolved =
                trackId !== undefined ? { id: trackId } : { appId: bundleId! };
              const iosRows = await fetchAppStoreReviewsResolved(resolved);
              if (iosRows.length === 0) {
                warnings.push(
                  "App Store: no review text returned for the resolved app (RSS may be empty or unavailable).",
                );
              } else {
                syncDebug(`App Store: ${iosRows.length} row(s)`, {
                  pages: APP_STORE_REVIEW_PAGES(),
                });
                pending.push(...iosRows);
              }
            } catch (e) {
              warnings.push(
                `App Store (reviews): ${e instanceof Error ? e.message : String(e)}`,
              );
            }
          }
        }
      }
  }

  if (activeSources.includes("trustpilot")) {
    try {
      const { rows, warnings: tpWarnings } =
        await scrapeTrustpilotWithDomainFallback(keyword, TRUSTPILOT_REVIEW_MAX());
      syncDebug(`Trustpilot: ${rows.length} row(s)`, {
        max: TRUSTPILOT_REVIEW_MAX(),
      });
      pending.push(...rows);
      warnings.push(...tpWarnings);
    } catch (e) {
      warnings.push(
        `Trustpilot: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  if (
    pending.length === 0 &&
    enabledPlatforms.length > 0 &&
    keyword &&
    warnings.length === 0
  ) {
    warnings.push(
      "No reviews were collected. Check the brand keyword or try an exact Play package / App Store bundle id.",
    );
  }

  const bySource: Record<string, number> = {};
  for (const r of pending) {
    bySource[r.source] = (bySource[r.source] ?? 0) + 1;
  }
  syncDebug("Collected totals (before DB dedupe)", {
    total: pending.length,
    bySource,
    note: "No date filter — limits are per-source caps (see env REPUTATION_GUARD_SYNC_*).",
  });
  const syncDebugOn = process.env.REPUTATION_GUARD_SYNC_DEBUG === "1";
  const syncDebugFull = process.env.REPUTATION_GUARD_SYNC_DEBUG_FULL === "1";
  if (syncDebugOn || syncDebugFull) {
    for (const row of pending) {
      const base = {
        source: row.source,
        createdAt: row.createdAt?.toISOString() ?? null,
        authorId: row.authorId,
      };
      console.log(
        "[reputation-guard:sync] row",
        syncDebugFull
          ? { ...base, content: row.content }
          : { ...base, textPreview: row.content.slice(0, 160) },
      );
    }
  }

  return { rows: pending, warnings };
}

function reviewDedupeKey(source: string, content: string): string {
  return `${source}\0${content}`;
}

export async function persistExternalReviewRows(
  prisma: Pick<PrismaClient, "review">,
  workspaceId: string,
  rows: ScrapedRow[],
): Promise<number> {
  const normalized = rows
    .map((row) => ({
      source: row.source,
      content: row.content.trim(),
      authorId: row.authorId,
      createdAt: row.createdAt,
    }))
    .filter((r) => r.content.length > 0);

  if (normalized.length === 0) return 0;

  const uniqueByKey = new Map<
    string,
    (typeof normalized)[number]
  >();
  for (const r of normalized) {
    const key = reviewDedupeKey(r.source, r.content);
    if (!uniqueByKey.has(key)) uniqueByKey.set(key, r);
  }
  const uniqueRows = [...uniqueByKey.values()];

  const existing = await prisma.review.findMany({
    where: {
      workspaceId,
      OR: uniqueRows.map((r) => ({ source: r.source, content: r.content })),
    },
    select: { source: true, content: true },
  });

  const existingKeys = new Set(
    existing.map((e) => reviewDedupeKey(e.source, e.content)),
  );

  const toCreate = uniqueRows.filter(
    (row) => !existingKeys.has(reviewDedupeKey(row.source, row.content)),
  );

  if (toCreate.length === 0) return 0;

  const { count } = await prisma.review.createMany({
    data: toCreate.map((row) => ({
      workspaceId,
      source: row.source,
      content: row.content,
      authorId: row.authorId,
      ...(row.createdAt ? { createdAt: row.createdAt } : {}),
    })),
  });

  return count;
}
