import {
  DashboardPageContent,
  type DashboardSearchParams,
} from "@/components/dashboard/dashboard-page-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | Reputation Guard",
  description: "Analytics overview for reviews and sentiment",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams> | DashboardSearchParams;
}) {
  return <DashboardPageContent searchParams={searchParams} />;
}
