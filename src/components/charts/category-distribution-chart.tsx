"use client";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategoryCount } from "@/lib/dashboard-stats";

export type CategoryDistributionChartProps = {
  data: CategoryCount[];
  rawReviewCount?: number;
  chartVariant?: "default" | "dark";
};

const DARK_CHART = {
  grid: "rgba(255,255,255,0.1)",
  tick: "rgba(255,255,255,0.72)",
  empty: "rgba(255,255,255,0.65)",
  tooltipBg: "rgba(20, 24, 52, 0.96)",
  tooltipBorder: "rgba(255,255,255,0.12)",
  pieStroke: "rgba(22, 26, 58, 0.95)",
} as const;

const PIE_COLORS = [
  "#0075ff",
  "#4338ca",
  "#b45309",
  "#be123c",
  "#0369a1",
  "#6d28d9",
  "#15803d",
  "#a21caf",
];

export function CategoryDistributionChart({
  data,
  rawReviewCount = 0,
  chartVariant = "default",
}: CategoryDistributionChartProps) {
  const theme = useTheme();
  const dark = chartVariant === "dark";
  const gridStroke = dark ? DARK_CHART.grid : theme.palette.divider;
  const tickFill = dark ? DARK_CHART.tick : theme.palette.text.secondary;
  const pieStroke = dark ? DARK_CHART.pieStroke : theme.palette.background.paper;
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
          sx={{ maxWidth: 440, ...(dark ? { color: DARK_CHART.empty } : {}) }}
        >
          {showRawHint
            ? `Categories come from AI analysis. With ${rawReviewCount} raw review(s), run "Ask AI to Analyze & Reply" in Inbox to populate this chart.`
            : "No categories yet. Issue distribution will appear once reviews are categorized by AI."}
        </Typography>
      </Box>
    );
  }

  const pieData = data.map((d) => ({
    name: d.category,
    value: d.count,
  }));
  const total = pieData.reduce((sum, p) => sum + p.value, 0);

  return (
    <Box
      sx={{
        width: "100%",
        height: { xs: 360, md: 320 },
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        alignItems: "center",
        gap: 2,
      }}
    >
      <Box sx={{ width: "100%", height: 260, maxWidth: { md: "50%" } }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={3}
              label={false}
            >
              {pieData.map((_, index) => (
                <Cell
                  key={pieData[index].name}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                  stroke={pieStroke}
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <text
              x="50%"
              y="46%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={dark ? "#fff" : theme.palette.text.primary}
              style={{ fontSize: 28, fontWeight: 700 }}
            >
              {total}
            </text>
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill={dark ? DARK_CHART.tick : theme.palette.text.secondary}
              style={{ fontSize: 11, letterSpacing: "0.05em", textTransform: "uppercase" }}
            >
              analyses
            </text>
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: `1px solid ${dark ? DARK_CHART.tooltipBorder : theme.palette.divider}`,
                boxShadow: theme.shadows[4],
                backgroundColor: dark ? DARK_CHART.tooltipBg : undefined,
                color: dark ? "#fff" : undefined,
                padding: "8px 10px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </Box>
      <Box sx={{ flex: 1, width: "100%", height: { xs: 240, md: 260 } }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={pieData}
            layout="vertical"
            margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="4 6" stroke={gridStroke} vertical={false} />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 12, fill: tickFill }}
              axisLine={{ stroke: gridStroke }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={118}
              tickFormatter={(name: string) =>
                name.length > 14 ? `${name.slice(0, 12)}…` : name
              }
              tick={{ fontSize: 11, fill: tickFill }}
              tickLine={false}
              axisLine={{ stroke: gridStroke }}
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
            />
            <Bar dataKey="value" name="Analyses" radius={[0, 8, 8, 0]} barSize={14}>
              {pieData.map((_, index) => (
                <Cell
                  key={pieData[index].name}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}
