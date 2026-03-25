"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { SentimentTrendPoint } from "@/lib/dashboard-stats";

export type SentimentTrendChartProps = {
  data: SentimentTrendPoint[];
  /** When positive and there is no trend data, explains that charts need AI analysis. */
  rawReviewCount?: number;
  /** Light axes/tooltip for Vision-style dark dashboard cards. */
  chartVariant?: "default" | "dark";
};

function formatDateLabel(isoDay: string) {
  const d = new Date(`${isoDay}T12:00:00.000Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

const DARK_CHART = {
  grid: "rgba(255,255,255,0.1)",
  tick: "rgba(255,255,255,0.72)",
  empty: "rgba(255,255,255,0.65)",
  tooltipBg: "rgba(20, 24, 52, 0.96)",
  tooltipBorder: "rgba(255,255,255,0.12)",
} as const;

export function SentimentTrendChart({
  data,
  rawReviewCount = 0,
  chartVariant = "default",
}: SentimentTrendChartProps) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
  const dark = chartVariant === "dark";
  const gridStroke = dark ? DARK_CHART.grid : theme.palette.divider;
  const tickFill = dark ? DARK_CHART.tick : theme.palette.text.secondary;
  const emptyColor = dark ? DARK_CHART.empty : undefined;
  const [clientReady, setClientReady] = useState(false);
  useEffect(() => {
    void Promise.resolve().then(() => {
      setClientReady(true);
    });
  }, []);

  if (data.length === 0) {
    const showRawHint = clientReady && rawReviewCount > 0;
    return (
      <Box
        sx={{
          height: 320,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 2,
        }}
      >
        <Typography
          color={dark ? undefined : "text.secondary"}
          variant="body2"
          align="center"
          sx={{ maxWidth: 440, ...(emptyColor ? { color: emptyColor } : {}) }}
        >
          {showRawHint
            ? `This chart uses AI-analyzed reviews only. You already have ${rawReviewCount} raw review(s)—open Inbox, open a ticket, and use "Ask AI to Analyze & Reply" to build sentiment over time.`
            : "No analysis data yet. Sentiment trend will appear after reviews are analyzed with AI."}
        </Typography>
      </Box>
    );
  }

  const chartData = data.map((d) => ({
    ...d,
    label: formatDateLabel(d.date),
  }));

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ width: "100%", height: { xs: 280, sm: 320 } }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 10, left: 0, bottom: 10 }}
          >
          <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: tickFill }}
            tickLine={false}
            axisLine={{ stroke: gridStroke }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: tickFill }}
            tickLine={false}
            axisLine={{ stroke: gridStroke }}
            width={36}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: `1px solid ${dark ? DARK_CHART.tooltipBorder : theme.palette.divider}`,
              boxShadow: theme.shadows[4],
              backgroundColor: dark ? DARK_CHART.tooltipBg : undefined,
              color: dark ? "#fff" : undefined,
              padding: "8px 10px",
            }}
            formatter={(value) => [
              typeof value === "number" ? `${value}` : String(value ?? ""),
              "Avg. sentiment",
            ]}
            labelFormatter={(_, payload) => {
              const p = payload?.[0]?.payload as { date?: string } | undefined;
              return p?.date
                ? new Date(`${p.date}T12:00:00.000Z`).toLocaleDateString("en-US")
                : "";
            }}
          />
          <Line
            type="monotone"
            dataKey="averageSentiment"
            name="Avg. sentiment"
            stroke={primary}
            strokeWidth={3}
            dot={{ r: 4, fill: primary, stroke: dark ? "#0b1437" : "#fff", strokeWidth: 2 }}
            activeDot={{ r: 6, fill: primary, stroke: dark ? "#0b1437" : "#fff", strokeWidth: 2 }}
            isAnimationActive={false}
            connectNulls
          />
          </LineChart>
        </ResponsiveContainer>
      </Box>
      {data.length === 1 ? (
        <Typography
          variant="caption"
          sx={{
            mt: 1,
            display: "block",
            textAlign: "center",
            px: 1,
            ...(dark ? { color: DARK_CHART.empty } : { color: "text.secondary" }),
          }}
        >
          All analyzed reviews fall on the same calendar day — the line appears once there are
          averages for at least two different days (by review date).
        </Typography>
      ) : null}
    </Box>
  );
}
