"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";
import { appTheme } from "@/theme/mui-theme";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ key: "mui" }}>
      <ThemeProvider theme={appTheme}>
        <CssBaseline />
        <Box
          component="div"
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}
