import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { TicketList } from "@/components/inbox/ticket-list";
import { isPrismaConnectionError } from "@/lib/is-prisma-connection-error";
import { prisma } from "@/lib/prisma";
import { visionAppText } from "@/lib/vision-ui/shell";
import type { InboxReview } from "@/types/inbox";

export type InboxPageContentProps = {
  /** When true, typography and table match the dark Vision home shell. */
  embeddedInDarkShell?: boolean;
};

export async function InboxPageContent({
  embeddedInDarkShell = false,
}: InboxPageContentProps = {}) {
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

  const dark = embeddedInDarkShell;

  const inner = (
    <>
      <Box sx={{ mb: dark ? 2.5 : { xs: 2, sm: 3 }, flexShrink: 0 }}>
        <Typography
          variant="h4"
          component="h1"
          fontWeight={700}
          sx={{ color: dark ? visionAppText.title : undefined }}
        >
          Tickets
        </Typography>
        <Typography
          variant="body1"
          color={dark ? undefined : "text.secondary"}
          sx={{ mt: 0.5, ...(dark ? { color: visionAppText.muted } : {}) }}
        >
          Open a row for the full review and AI reply drafts.
        </Typography>
      </Box>
      {dbMessage ? (
        dark ? (
          <Alert
            severity="warning"
            variant="outlined"
            sx={{
              flexShrink: 0,
              mb: 2,
              color: "rgba(255,255,255,0.92)",
              borderColor: "rgba(255, 181, 71, 0.5)",
              bgcolor: "rgba(255, 181, 71, 0.08)",
              "& .MuiAlert-icon": { color: "#ffb547" },
            }}
          >
            <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ color: "#fff" }}>
              Database unreachable
            </Typography>
            <Typography variant="body2" sx={{ color: visionAppText.muted }}>
              Start PostgreSQL or update <code style={{ color: "#c4d4ff" }}>DATABASE_URL</code>, then
              refresh.
            </Typography>
            <Typography
              variant="caption"
              component="pre"
              sx={{ display: "block", mt: 1, whiteSpace: "pre-wrap", opacity: 0.85 }}
            >
              {dbMessage}
            </Typography>
          </Alert>
        ) : (
          <Alert severity="warning" sx={{ flexShrink: 0, mb: 2 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Database unreachable
            </Typography>
            <Typography variant="body2">
              Start PostgreSQL or update <code>DATABASE_URL</code>, then refresh.
            </Typography>
            <Typography
              variant="caption"
              component="pre"
              sx={{ display: "block", mt: 1, whiteSpace: "pre-wrap", opacity: 0.85 }}
            >
              {dbMessage}
            </Typography>
          </Alert>
        )
      ) : null}
      <TicketList reviews={reviews} visualVariant={dark ? "dark" : "light"} />
    </>
  );

  if (dark) {
    return (
      <Box
        component="main"
        sx={{
          flex: 1,
          py: { xs: 2, sm: 2.5 },
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          bgcolor: "transparent",
          overflow: "hidden",
        }}
      >
        {inner}
      </Box>
    );
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
      <Container>{inner}</Container>
    </Box>
  );
}
