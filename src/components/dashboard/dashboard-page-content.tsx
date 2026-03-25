import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { Suspense } from "react";
import { CategoryDistributionChart } from "@/components/charts/category-distribution-chart";
import { SentimentTrendChart } from "@/components/charts/sentiment-trend-chart";
import { DataSourcesSidebar } from "@/components/dashboard/data-sources-sidebar";
import { WorkspaceSelector } from "@/components/layout/workspace-selector";
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

function MetricCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ fontWeight: 600, letterSpacing: 0.5 }}
        >
          {title}
        </Typography>
        <Typography
          variant="h3"
          component="p"
          sx={{
            mt: 1,
            fontWeight: 700,
            fontSize: { xs: "2rem", sm: "2.75rem" },
            lineHeight: 1.15,
          }}
        >
          {value}
        </Typography>
        {subtitle ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {subtitle}
          </Typography>
        ) : null}
      </CardContent>
    </Card>
  );
}

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

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "stretch",
        bgcolor: "grey.50",
        minHeight: 0,
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
              <Typography variant="h4" component="h1" fontWeight={700}>
                Analytics dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                Live metrics from your workspace reviews and AI analysis results.
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
              <WorkspaceSelector resolvedWorkspaceId={activeWorkspace?.id ?? null} />
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

          <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <MetricCard
                title="Total reviews"
                value={String(stats.totalReviews)}
                subtitle={
                  stats.dbUnavailable
                    ? "Connect the database to load data"
                    : "All ingested feedback records"
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <MetricCard
                title="Average sentiment"
                value={avgLabel}
                subtitle={
                  stats.averageSentiment != null
                    ? "Mean score across analyzed reviews (1–100)"
                    : "No analysis results yet"
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <MetricCard
                title="Critical issues"
                value={String(stats.criticalIssuesCount)}
                subtitle="Analyses flagged as critical"
              />
            </Grid>
          </Grid>

          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid size={{ xs: 12, lg: 7 }}>
              <Card
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Sentiment trend
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Daily average sentiment score based on analysis timestamps.
                  </Typography>
                  <SentimentTrendChart
                    data={stats.sentimentByDay}
                    rawReviewCount={stats.totalReviews}
                  />
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, lg: 5 }}>
              <Card
                elevation={0}
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  height: "100%",
                }}
              >
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Issues by category
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Distribution of AI-assigned categories (donut + bar).
                  </Typography>
                  <CategoryDistributionChart
                    data={stats.categoryCounts}
                    rawReviewCount={stats.totalReviews}
                  />
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Box>

      <Suspense
        fallback={
          <Box
            component="aside"
            sx={{
              width: 320,
              flexShrink: 0,
              bgcolor: "background.paper",
              borderLeft: 1,
              borderColor: "divider",
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
  );
}
