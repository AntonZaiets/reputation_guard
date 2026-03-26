"use client";

import ConfirmationNumberOutlined from "@mui/icons-material/ConfirmationNumberOutlined";
import DashboardRounded from "@mui/icons-material/DashboardRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import type { SvgIconComponent } from "@mui/icons-material";
import { Children, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HOME_TAB_DASHBOARD,
  HOME_TAB_INBOX,
  resolveHomeTab,
  type HomeTabValue,
} from "@/components/home/home-tab-utils";
import { visionDarkScrollContainerSx } from "@/lib/vision-ui/scrollbar-sx";
import { visionAppShellBg, visionAppText } from "@/lib/vision-ui/shell";

function ShellNavItem({
  selected,
  onClick,
  Icon,
  label,
  tabId,
}: {
  selected: boolean;
  onClick: () => void;
  Icon: SvgIconComponent;
  label: string;
  tabId: string;
}) {
  const theme = useTheme();
  return (
    <ButtonBase
      focusRipple
      onClick={onClick}
      role="tab"
      aria-selected={selected}
      id={`shell-tab-${tabId}`}
      sx={{
        width: "100%",
        display: "block",
        borderRadius: "12px",
        textAlign: "left",
        py: 1,
        px: 1,
        bgcolor: selected ? "rgba(0, 117, 255, 0.1)" : "transparent",
        transition: "background-color 0.18s ease",
        "&:hover": {
          bgcolor: selected ? "rgba(0, 117, 255, 0.14)" : "rgba(255,255,255,0.04)",
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 0.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            bgcolor: selected ? theme.palette.primary.main : "rgba(255,255,255,0.08)",
            color: selected ? "#fff" : visionAppText.muted,
            transition: "background-color 0.18s ease, color 0.18s ease",
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Box>
        <Typography
          component="span"
          sx={{
            fontWeight: 600,
            fontSize: "0.875rem",
            color: selected ? visionAppText.title : visionAppText.muted,
            letterSpacing: "0.01em",
          }}
        >
          {label}
        </Typography>
      </Stack>
    </ButtonBase>
  );
}

export function HomeWorkspaceClient({
  initialTab,
  children,
}: {
  initialTab: HomeTabValue;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTab = resolveHomeTab(searchParams.get("tab"));
  const [view, setView] = useState<HomeTabValue>(() => resolveHomeTab(initialTab));

  const prevWorkspaceRef = useRef<string | null>(null);
  const bootRef = useRef(false);

  useEffect(() => {
    setView(urlTab);
  }, [urlTab]);

  /** Refresh RSC only when workspace changes — not when switching tab (avoids blocking UI). */
  useEffect(() => {
    const wid = searchParams.get("workspaceId");
    if (!bootRef.current) {
      bootRef.current = true;
      prevWorkspaceRef.current = wid;
      return;
    }
    if (prevWorkspaceRef.current !== wid) {
      prevWorkspaceRef.current = wid;
      router.refresh();
    }
  }, [router, searchParams]);

  const parts = Children.toArray(children);
  const dashboardPanel = parts[0] ?? null;
  const inboxPanel = parts[1] ?? null;

  const setWorkspaceTab = (next: HomeTabValue) => {
    setView(next);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", next);
    router.replace(`/?${nextParams.toString()}`, { scroll: false });
  };

  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        minHeight: 0,
        minWidth: 0,
        maxHeight: "100dvh",
        overflow: "hidden",
        colorScheme: "dark",
        ...visionAppShellBg,
      }}
    >
      <Box
        component="aside"
        aria-label="Main navigation"
        sx={{
          width: { xs: "100%", sm: 240 },
          flexShrink: 0,
          px: 2,
          pt: 2,
          pb: { xs: 1.5, sm: 2 },
          borderRight: { xs: "none", sm: "1px solid rgba(255, 255, 255, 0.08)" },
          borderBottom: { xs: "1px solid rgba(255, 255, 255, 0.08)", sm: "none" },
          bgcolor: { xs: "rgba(6, 11, 40, 0.35)", sm: "rgba(6, 11, 40, 0.55)" },
          backdropFilter: { sm: "blur(12px)" },
        }}
      >
        <Typography variant="h5" component="h1" fontWeight={700} sx={{ color: visionAppText.title }}>
          Reputation Guard
        </Typography>
        <Stack
          spacing={0.5}
          sx={{ mt: { xs: 2, sm: 3 } }}
          role="tablist"
          aria-label="Workspace views"
        >
          <ShellNavItem
            tabId="dashboard"
            selected={view === HOME_TAB_DASHBOARD}
            onClick={() => setWorkspaceTab(HOME_TAB_DASHBOARD)}
            Icon={DashboardRounded}
            label="Dashboard"
          />
          <ShellNavItem
            tabId="tickets"
            selected={view === HOME_TAB_INBOX}
            onClick={() => setWorkspaceTab(HOME_TAB_INBOX)}
            Icon={ConfirmationNumberOutlined}
            label="Tickets"
          />
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
          pb: 2,
          pt: { xs: 1.5, sm: 2 },
        }}
      >
        <Box
          sx={{
            display: view === HOME_TAB_DASHBOARD ? "flex" : "none",
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            flexDirection: "column",
            overflowY: "auto",
            overflowX: "hidden",
            ...visionDarkScrollContainerSx,
          }}
        >
          {dashboardPanel}
        </Box>
        <Box
          sx={{
            display: view === HOME_TAB_INBOX ? "flex" : "none",
            flex: 1,
            minHeight: 0,
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {inboxPanel}
        </Box>
      </Box>
    </Box>
  );
}
