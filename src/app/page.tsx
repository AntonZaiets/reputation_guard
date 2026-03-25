import { HomeWorkspaceClient } from "@/components/home/home-workspace-client";
import { firstSearchParamValue, resolveHomeTab } from "@/components/home/home-tab-utils";
import {
  DashboardPageContent,
  type DashboardSearchParams,
} from "@/components/dashboard/dashboard-page-content";
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
    <HomeWorkspaceClient initialTab={tab}>
      <DashboardPageContent searchParams={dashboardParams} />
      <InboxPageContent embeddedInDarkShell />
    </HomeWorkspaceClient>
  );
}
