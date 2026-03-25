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
};

function formatDateLabel(isoDay: string) {
  const d = new Date(`${isoDay}T12:00:00.000Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function SentimentTrendChart({
  data,
  rawReviewCount = 0,
}: SentimentTrendChartProps) {
  const theme = useTheme();
  const primary = theme.palette.primary.main;
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
          color="text.secondary"
          variant="body2"
          align="center"
          sx={{ maxWidth: 440 }}
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
    <Box sx={{ width: "100%", height: { xs: 280, sm: 320 } }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={{ stroke: theme.palette.divider }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: theme.palette.text.secondary }}
            tickLine={false}
            axisLine={{ stroke: theme.palette.divider }}
            width={36}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[4],
            }}
            formatter={(value) => [
              typeof value === "number" ? String(value) : String(value ?? ""),
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
            stroke={primary}
            strokeWidth={2}
            dot={{ r: 3, fill: primary }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
