"use client";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useRouter, useSearchParams } from "next/navigation";
import type { SyntheticEvent } from "react";

export const HOME_TAB_DASHBOARD = "dashboard";
export const HOME_TAB_INBOX = "inbox";

export type HomeTabValue = typeof HOME_TAB_DASHBOARD | typeof HOME_TAB_INBOX;

export function HomeWorkspaceTabs({ currentTab }: { currentTab: HomeTabValue }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (_: SyntheticEvent, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", value);
    router.push(`/?${next.toString()}`);
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs
        value={currentTab}
        onChange={handleChange}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: 48,
          "& .MuiTab-root": {
            textTransform: "none",
            fontWeight: 600,
            fontSize: "0.9375rem",
          },
        }}
      >
        <Tab label="Analytics dashboard" value={HOME_TAB_DASHBOARD} />
        <Tab label="Ticket inbox" value={HOME_TAB_INBOX} />
      </Tabs>
    </Box>
  );
}
