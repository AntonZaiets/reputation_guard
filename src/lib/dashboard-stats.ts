import { isPrismaConnectionError } from "@/lib/is-prisma-connection-error";
import { prisma } from "@/lib/prisma";

export type SentimentTrendPoint = {
  date: string;
  averageSentiment: number;
  count: number;
};

export type CategoryCount = {
  category: string;
  count: number;
};

export type DashboardStats = {
  totalReviews: number;
  /** Reviews in this workspace with no AnalysisResult yet (charts need AI rows). */
  pendingAnalysisCount: number;
  averageSentiment: number | null;
  criticalIssuesCount: number;
  sentimentByDay: SentimentTrendPoint[];
  categoryCounts: CategoryCount[];
  /** When true, metrics are placeholders and the database was unreachable. */
  dbUnavailable: boolean;
  dbMessage: string | null;
};

const EMPTY_STATS: Omit<DashboardStats, "dbUnavailable" | "dbMessage"> = {
  totalReviews: 0,
  pendingAnalysisCount: 0,
  averageSentiment: null,
  criticalIssuesCount: 0,
  sentimentByDay: [],
  categoryCounts: [],
};

export function unreachableDashboardStats(dbMessage: string): DashboardStats {
  return {
    ...EMPTY_STATS,
    dbUnavailable: true,
    dbMessage,
  };
}

export async function getDashboardStats(
  workspaceId: string | null,
): Promise<DashboardStats> {
  if (workspaceId === null) {
    return {
      ...EMPTY_STATS,
      dbUnavailable: false,
      dbMessage: null,
    };
  }

  try {
    const [totalReviews, pendingAnalysisCount, analyses] = await Promise.all([
      prisma.review.count({ where: { workspaceId } }),
      prisma.review.count({
        where: { workspaceId, analysis: { is: null } },
      }),
      prisma.analysisResult.findMany({
        where: { review: { workspaceId } },
        select: {
          sentimentScore: true,
          isCritical: true,
          category: true,
          createdAt: true,
          review: { select: { createdAt: true } },
        },
        orderBy: { review: { createdAt: "asc" } },
      }),
    ]);

    const criticalIssuesCount = analyses.filter((a) => a.isCritical).length;

    const averageSentiment =
      analyses.length > 0
        ? analyses.reduce((sum, a) => sum + a.sentimentScore, 0) / analyses.length
        : null;

    /** Trend by calendar day of the review (not AI run time), so batch-analyze doesn’t collapse to one dot. */
    const dayBuckets = new Map<string, { sum: number; count: number }>();
    for (const a of analyses) {
      const key = a.review.createdAt.toISOString().slice(0, 10);
      const cur = dayBuckets.get(key) ?? { sum: 0, count: 0 };
      cur.sum += a.sentimentScore;
      cur.count += 1;
      dayBuckets.set(key, cur);
    }

    const sentimentByDay: SentimentTrendPoint[] = [...dayBuckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { sum, count }]) => ({
        date,
        averageSentiment: Math.round((sum / count) * 10) / 10,
        count,
      }));

    const categoryMap = new Map<string, number>();
    for (const a of analyses) {
      const label = a.category.trim() || "Uncategorized";
      categoryMap.set(label, (categoryMap.get(label) ?? 0) + 1);
    }

    const categoryCounts: CategoryCount[] = [...categoryMap.entries()]
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalReviews,
      pendingAnalysisCount,
      averageSentiment:
        averageSentiment !== null ? Math.round(averageSentiment * 10) / 10 : null,
      criticalIssuesCount,
      sentimentByDay,
      categoryCounts,
      dbUnavailable: false,
      dbMessage: null,
    };
  } catch (err) {
    const dbMessage =
      err instanceof Error ? err.message : String(err);
    if (!isPrismaConnectionError(err)) {
      console.error("[getDashboardStats] unexpected error:", err);
    }
    return {
      ...EMPTY_STATS,
      dbUnavailable: true,
      dbMessage,
    };
  }
}
