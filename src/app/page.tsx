import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  DashboardPageContent,
  type DashboardSearchParams,
} from "@/components/dashboard/dashboard-page-content";
import {
  HOME_TAB_DASHBOARD,
  HOME_TAB_INBOX,
  HomeWorkspaceTabs,
  type HomeTabValue,
} from "@/components/home/home-workspace-tabs";
import { InboxPageContent } from "@/components/inbox/inbox-page-content";

export const dynamic = "force-dynamic";

type HomeSearchParams = DashboardSearchParams & { tab?: string };

function resolveTab(raw: unknown): HomeTabValue {
  return raw === HOME_TAB_INBOX ? HOME_TAB_INBOX : HOME_TAB_DASHBOARD;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams> | HomeSearchParams;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const tab = resolveTab(sp.tab);
  const dashboardParams: DashboardSearchParams = {
    workspaceId: typeof sp.workspaceId === "string" ? sp.workspaceId : undefined,
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        bgcolor: "grey.50",
      }}
    >
      <Box>
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" component="h1" fontWeight={700}>
              Reputation Guard
            </Typography>
            <Typography
              variant="subtitle2"
              sx={{ mt: 0.5, fontWeight: 500, color: "primary.main" }}
            >
              AI-powered brand reputation management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, maxWidth: 560 }}>
              Monitor feedback across channels, surface sentiment and risk, and draft on-brand
              replies with AI—so your team can protect and improve how customers see your brand.
            </Typography>
          </Box>
          <HomeWorkspaceTabs currentTab={tab} />
        </Stack>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
        {tab === HOME_TAB_INBOX ? (
          <InboxPageContent />
        ) : (
          <DashboardPageContent searchParams={dashboardParams} />
        )}
      </Box>
    </Box>
  );
}
