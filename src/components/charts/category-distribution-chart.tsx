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
};

const PIE_COLORS = [
  "#0f766e",
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
}: CategoryDistributionChartProps) {
  const theme = useTheme();
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
              innerRadius={52}
              outerRadius={88}
              paddingAngle={2}
              label={false}
            >
              {pieData.map((_, index) => (
                <Cell
                  key={pieData[index].name}
                  fill={PIE_COLORS[index % PIE_COLORS.length]}
                  stroke={theme.palette.background.paper}
                  strokeWidth={1}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[4],
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
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
            <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fontSize: 11, fill: theme.palette.text.secondary }}
              tickLine={false}
              axisLine={{ stroke: theme.palette.divider }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: `1px solid ${theme.palette.divider}`,
                boxShadow: theme.shadows[4],
              }}
            />
            <Bar dataKey="value" name="Reviews" radius={[0, 4, 4, 0]}>
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
