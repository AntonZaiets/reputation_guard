import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Suspense } from "react";
import {
  DashboardPageContent,
  type DashboardSearchParams,
} from "@/components/dashboard/dashboard-page-content";
import { HomeRscRefreshOnSearchParamsChange } from "@/components/home/home-rsc-refresh-on-search-params";
import {
  HOME_TAB_INBOX,
  firstSearchParamValue,
  resolveHomeTab,
} from "@/components/home/home-tab-utils";
import { HomeWorkspaceTabs } from "@/components/home/home-workspace-tabs";
import { InboxPageContent } from "@/components/inbox/inbox-page-content";

export const dynamic = "force-dynamic";

type HomeSearchParams = DashboardSearchParams & { tab?: string };

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<HomeSearchParams> | HomeSearchParams;
}) {
  const sp = searchParams instanceof Promise ? await searchParams : searchParams;
  const tab = resolveHomeTab(sp.tab);
  const dashboardParams: DashboardSearchParams = {
    workspaceId: firstSearchParamValue(sp.workspaceId),
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
      <Box sx={{ px: 2, pt: 2 }}>
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
          <Suspense
            fallback={
              <Box sx={{ borderBottom: 1, borderColor: "divider", minHeight: 48 }} aria-hidden />
            }
          >
            <HomeWorkspaceTabs initialTab={tab} />
            <HomeRscRefreshOnSearchParamsChange />
          </Suspense>
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          px: 2,
        }}
      >
        {tab === HOME_TAB_INBOX ? (
          <InboxPageContent />
        ) : (
          <DashboardPageContent searchParams={dashboardParams} />
        )}
      </Box>
    </Box>
  );
}
