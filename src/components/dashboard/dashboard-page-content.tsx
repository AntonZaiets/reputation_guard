import Psychology from "@mui/icons-material/Psychology";
import ReportProblem from "@mui/icons-material/ReportProblem";
import Reviews from "@mui/icons-material/Reviews";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Suspense } from "react";
import { CategoryDistributionChart } from "@/components/charts/category-distribution-chart";
import { SentimentTrendChart } from "@/components/charts/sentiment-trend-chart";
import { DashboardAnalyzePendingBanner } from "@/components/dashboard/dashboard-analyze-pending-banner";
import { DataSourcesSidebar } from "@/components/dashboard/data-sources-sidebar";
import { DATA_SOURCES_SIDEBAR_WIDTH_PX } from "@/lib/data-sources-sidebar-layout";
import { WorkspaceSelector } from "@/components/layout/workspace-selector";
import {
  DashboardWelcomeCard,
  MiniStatisticsCard,
  ReputationPulseCard,
  SentimentSatisfactionCard,
} from "@/components/vision-ui";
import { VISION } from "@/lib/vision-ui/colors";
import { visionAppText } from "@/lib/vision-ui/shell";
import { visionDashboardCardSx } from "@/lib/vision-ui/vision-card-sx";
import {
  type DashboardStats,
  getDashboardStats,
  unreachableDashboardStats,
} from "@/lib/dashboard-stats";
import {
  isPrismaClientSchemaMismatch,
  isPrismaConnectionError,
} from "@/lib/is-prisma-connection-error";
import { prisma } from "@/lib/prisma";

export type DashboardSearchParams = { workspaceId?: string };

export async function DashboardPageContent({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams> | DashboardSearchParams;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const paramWorkspaceId =
    typeof sp.workspaceId === "string" ? sp.workspaceId : undefined;

  let stats: DashboardStats;
  let activeWorkspace: {
    id: string;
    brandKeyword: string | null;
    activeSources: string[];
  } | null = null;
  let noWorkspaces = false;
  let prismaClientOutOfSync = false;

  try {
    const workspaces = await prisma.workspace.findMany({
      orderBy: { createdAt: "asc" },
      select: { id: true, brandKeyword: true, activeSources: true },
    });

    if (workspaces.length === 0) {
      noWorkspaces = true;
      stats = await getDashboardStats(null);
    } else {
      const resolved =
        (paramWorkspaceId ? workspaces.find((w) => w.id === paramWorkspaceId) : undefined) ??
        workspaces[0];
      activeWorkspace = resolved;
      stats = await getDashboardStats(resolved.id);
    }
  } catch (err) {
    prismaClientOutOfSync = isPrismaClientSchemaMismatch(err);
    if (!isPrismaConnectionError(err) && !prismaClientOutOfSync) {
      console.error("[DashboardPageContent] unexpected error:", err);
    }
    const message = err instanceof Error ? err.message : String(err);
    stats = unreachableDashboardStats(message);
    activeWorkspace = null;
  }

  const avgLabel =
    stats.averageSentiment != null
      ? `${stats.averageSentiment}`
      : "—";

  const hasAnalyses = !stats.dbUnavailable && stats.averageSentiment != null;

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "stretch",
        bgcolor: "transparent",
        minHeight: 0,
        minWidth: 0,
        height: "100%",
        maxWidth: "100%",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          py: { xs: 2, sm: 3, md: 4 },
        }}
      >
        <Box>
          <Box
            sx={{
              mb: { xs: 2, sm: 3 },
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { xs: "stretch", sm: "flex-start" },
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h4"
                component="h1"
                fontWeight={700}
                sx={{ color: visionAppText.title }}
              >
                Analytics dashboard
              </Typography>
              <Typography variant="body1" sx={{ mt: 0.5, color: visionAppText.muted }}>
                Vision-style overview of reviews, sentiment, and AI flags for the active workspace.
              </Typography>
            </Box>
            <Suspense
              fallback={
                <Box
                  sx={{
                    minWidth: { xs: "100%", sm: 260 },
                    height: 56,
                    bgcolor: "action.hover",
                    borderRadius: 1,
                  }}
                />
              }
            >
              <WorkspaceSelector
                resolvedWorkspaceId={activeWorkspace?.id ?? null}
                darkSurface
              />
            </Suspense>
          </Box>

          {noWorkspaces && !stats.dbUnavailable ? (
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Welcome to Reputation Guard
              </Typography>
              <Typography variant="body2" component="span" display="block">
                Add your first company with the selector above to start tracking reviews and
                configuring data sources. Charts will populate once you ingest feedback for that
                workspace.
              </Typography>
            </Alert>
          ) : null}

          {stats.dbUnavailable ? (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {prismaClientOutOfSync
                  ? "Prisma Client out of date"
                  : "Database unreachable"}
              </Typography>
              <Typography variant="body2" component="span" display="block">
                {prismaClientOutOfSync ? (
                  <>
                    Your database migration may have succeeded, but this app is still using an old
                    generated client (Next.js keeps a Prisma singleton in memory while{" "}
                    <code>next dev</code> runs). Stop the dev server, run{" "}
                    <code>npx prisma generate</code>, start <code>npm run dev</code> again, then
                    refresh. Showing empty metrics until then.
                  </>
                ) : (
                  <>
                    Start PostgreSQL (or fix <code>DATABASE_URL</code> in <code>.env</code>), then
                    refresh. Showing empty metrics until the connection works.
                  </>
                )}
              </Typography>
              {stats.dbMessage ? (
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{ display: "block", mt: 1, whiteSpace: "pre-wrap", opacity: 0.85 }}
                >
                  {stats.dbMessage}
                </Typography>
              ) : null}
            </Alert>
          ) : null}

          <DashboardAnalyzePendingBanner
            workspaceId={activeWorkspace?.id ?? null}
            pendingCount={stats.pendingAnalysisCount}
            disabled={stats.dbUnavailable}
          />

          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <MiniStatisticsCard
                title="Total reviews"
                count={String(stats.totalReviews)}
                icon={<Reviews sx={{ fontSize: 22, color: "#fff" }} />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <MiniStatisticsCard
                title="Average sentiment"
                count={avgLabel}
                icon={<Psychology sx={{ fontSize: 22, color: "#fff" }} />}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <MiniStatisticsCard
                title="Critical issues"
                count={String(stats.criticalIssuesCount)}
                icon={<ReportProblem sx={{ fontSize: 22, color: "#fff" }} />}
              />
            </Grid>
          </Grid>

          <Stack spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
            {/* Row 1: Welcome back + Sentiment index */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={2.25}
              sx={{ alignItems: "stretch" }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <DashboardWelcomeCard workspaceLabel={activeWorkspace?.brandKeyword ?? null} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <SentimentSatisfactionCard
                  averageSentiment={stats.averageSentiment}
                  hasAnalyses={hasAnalyses}
                />
              </Box>
            </Stack>

            {/* Row 2: Sentiment trend (full width) */}
            <Box sx={{ width: "100%", minWidth: 0 }}>
              <Card
                elevation={0}
                sx={{
                  ...visionDashboardCardSx,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: "#fff" }}>
                    Sentiment trend
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2, color: VISION.text.main }}>
                    Daily average sentiment by review date (ingested reviews), using AI scores.
                  </Typography>
                  <SentimentTrendChart
                    data={stats.sentimentByDay}
                    rawReviewCount={stats.totalReviews}
                    chartVariant="dark"
                  />
                </CardContent>
              </Card>
            </Box>

            {/* Row 3: Reputation pulse + Issues by category */}
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={{ xs: 2, sm: 3 }}
              sx={{ alignItems: "stretch" }}
            >
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <ReputationPulseCard
                  totalReviews={stats.totalReviews}
                  criticalIssuesCount={stats.criticalIssuesCount}
                  averageSentiment={stats.averageSentiment}
                  hasAnalyses={hasAnalyses}
                />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Card
                  elevation={0}
                  sx={{
                    ...visionDashboardCardSx,
                    height: "100%",
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom sx={{ color: "#fff" }}>
                      Issues by category
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2, color: VISION.text.main }}>
                      Distribution of AI-assigned categories (donut + bar).
                    </Typography>
                    <CategoryDistributionChart
                      data={stats.categoryCounts}
                      rawReviewCount={stats.totalReviews}
                      chartVariant="dark"
                    />
                  </CardContent>
                </Card>
              </Box>
            </Stack>
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignSelf: "stretch",
          flexShrink: 0,
          ml: { xs: 0, md: 2 },
          minHeight: { md: 0 },
          minWidth: 0,
        }}
      >
        <Suspense
          fallback={
            <Box
              component="aside"
              sx={{
                width: DATA_SOURCES_SIDEBAR_WIDTH_PX,
                flex: { xs: "none", md: 1 },
                minHeight: { md: 240 },
                flexShrink: 0,
                bgcolor: "rgba(8, 12, 32, 0.92)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: { xs: 2.5, md: "22px 0 0 22px" },
                boxSizing: "border-box",
              }}
            />
          }
        >
          <DataSourcesSidebar
            key={activeWorkspace?.id ?? "no-workspace"}
            workspaceId={activeWorkspace?.id ?? null}
            initialBrandKeyword={activeWorkspace?.brandKeyword ?? null}
            initialActiveSources={activeWorkspace?.activeSources ?? []}
            disabled={stats.dbUnavailable}
          />
        </Suspense>
      </Box>
    </Box>
  );
}
