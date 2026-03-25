import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { TicketList } from "@/components/inbox/ticket-list";
import { isPrismaConnectionError } from "@/lib/is-prisma-connection-error";
import { prisma } from "@/lib/prisma";
import type { InboxReview } from "@/types/inbox";

export async function InboxPageContent() {
  let reviews: InboxReview[] = [];
  let dbMessage: string | null = null;

  try {
    const rows = await prisma.review.findMany({
      include: { analysis: true },
      orderBy: { createdAt: "desc" },
    });
    reviews = JSON.parse(JSON.stringify(rows)) as InboxReview[];
  } catch (err) {
    dbMessage = err instanceof Error ? err.message : String(err);
    if (!isPrismaConnectionError(err)) {
      console.error("[InboxPageContent] unexpected error:", err);
    }
  }

  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        py: { xs: 2, sm: 3, md: 4 },
        bgcolor: "grey.50",
      }}
    >
      <Container>
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Inbox
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Open a ticket to view the full review and copy AI-suggested replies.
          </Typography>
        </Box>
        {dbMessage ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Database unreachable
            </Typography>
            <Typography variant="body2">
              Start PostgreSQL or update <code>DATABASE_URL</code>, then refresh. The inbox will
              stay empty until the database is available.
            </Typography>
            <Typography
              variant="caption"
              component="pre"
              sx={{ display: "block", mt: 1, whiteSpace: "pre-wrap", opacity: 0.85 }}
            >
              {dbMessage}
            </Typography>
          </Alert>
        ) : null}
        <TicketList reviews={reviews} />
      </Container>
    </Box>
  );
}
