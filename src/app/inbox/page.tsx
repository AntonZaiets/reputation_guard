import { InboxPageContent } from "@/components/inbox/inbox-page-content";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Inbox | Reputation Guard",
  description: "Review tickets and AI reply drafts",
};

export default async function InboxPage() {
  return <InboxPageContent />;
}
