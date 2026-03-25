"use client";

import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useState, type SyntheticEvent } from "react";
import {
  HOME_TAB_DASHBOARD,
  HOME_TAB_INBOX,
  resolveHomeTab,
  type HomeTabValue,
} from "@/components/home/home-tab-utils";

export function HomeWorkspaceTabs({
  initialTab = HOME_TAB_DASHBOARD,
}: {
  initialTab?: HomeTabValue;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = resolveHomeTab(searchParams.get("tab"));

  const [selectedTab, setSelectedTab] = useState<HomeTabValue>(() => resolveHomeTab(initialTab));

  useEffect(() => {
    setSelectedTab(tabFromUrl);
  }, [tabFromUrl]);

  const handleChange = (_: SyntheticEvent, value: string) => {
    const nextTab = resolveHomeTab(value);
    setSelectedTab(nextTab);
    const next = new URLSearchParams(searchParams.toString());
    next.set("tab", nextTab);
    const href = `/?${next.toString()}`;
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
      <Tabs
        value={resolveHomeTab(selectedTab)}
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
