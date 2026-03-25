"use client";

import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { draftCardBodySx, draftCardRootSx } from "./draft-card.styles";
import type { DraftCardProps } from "./draft-card.types";

export function DraftCard({
  title,
  subtitle,
  text,
  copyKey,
  tooltipDraft,
  onCopy,
}: DraftCardProps) {
  const body = text?.trim() || "No draft generated.";
  const canCopy = Boolean(text?.trim());

  return (
    <Card variant="outlined" sx={draftCardRootSx}>
      <CardHeader
        title={title}
        subheader={subtitle}
        action={
          <Tooltip
            open={tooltipDraft === copyKey}
            title="Copied!"
            placement="left"
            disableFocusListener
            disableTouchListener
          >
            <span>
              <IconButton
                size="small"
                aria-label={`Copy ${title} draft`}
                disabled={!canCopy}
                onClick={() => canCopy && text && onCopy(text, copyKey)}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </span>
          </Tooltip>
        }
        titleTypographyProps={{ variant: "subtitle1", fontWeight: 600 }}
        subheaderTypographyProps={{ variant: "caption" }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Typography variant="body2" color="text.secondary" sx={draftCardBodySx}>
          {body}
        </Typography>
      </CardContent>
    </Card>
  );
}
