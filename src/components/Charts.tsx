import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend, LabelList } from "recharts";
import { Stack, Typography, Paper, Box } from "@mui/material";
import dayjs from "dayjs";
import type { ParsedRow } from "../utils/csv";

const fmt = (v: number) =>
    v.toLocaleString(undefined, { 
        style: "currency", 
        currency: "USD", 
        maximumFractionDigits: 0 
    });

const CATEGORY_COLORS = ["#1976d2","#9c27b0","#2e7d32","#ed6c02","#d32f2f","#0288d1","#7b1fa2","#388e3c"];
const REGION_COLORS   = ["#1976d2","#9c27b0","#2e7d32","#ed6c02","#d32f2f","#0288d1"];

const colorFor = (name: string, palette: string[]) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % palette.length;
  return palette[idx];
};


function renderCategoryLegend(props: any) {
  const payload = (props?.payload ?? []) as Array<{ value: string }>;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap" }}>
      {payload.map((entry, i) => (
        <li key={i} style={{ marginRight: 12, display: "flex", alignItems: "center" }}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
              marginRight: 6,
            }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

function renderRegionLegend(props: any) {
  const payload = (props?.payload ?? []) as Array<{ value: string }>;
  return (
    <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexWrap: "wrap" }}>
      {payload.map((entry, i) => (
        <li key={i} style={{ marginRight: 12, display: "flex", alignItems: "center" }}>
          <span
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              backgroundColor: REGION_COLORS[i % REGION_COLORS.length],
              marginRight: 6,
            }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}


type Props = { rows: ParsedRow[] };

// Helper aggregations
function byDate(rows: ParsedRow[]) {
  const map = new Map<string, number>();
  rows.forEach(r => {
    const d = dayjs(r.date).format("YYYY-MM-DD");
    map.set(d, (map.get(d) ?? 0) + r.amount);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, amount]) => ({ date, amount }));
}
function byCategory(rows: ParsedRow[]) {
  const map = new Map<string, number>();
  rows.forEach(r => map.set(r.category, (map.get(r.category) ?? 0) + r.amount));
  return Array.from(map.entries()).map(([category, amount]) => ({ category, amount }));
}
function byRegion(rows: ParsedRow[]) {
  const map = new Map<string, number>();
  rows.forEach(r => map.set(r.region || "Unknown", (map.get(r.region || "Unknown") ?? 0) + r.amount));
  return Array.from(map.entries()).map(([region, amount]) => ({ name: region, value: amount }));
}

export function Charts({ rows }: Props) {
  const lineData = byDate(rows);
  const barData = byCategory(rows);
  const pieData = byRegion(rows);

  return (
    <Stack spacing={3}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Amount by Date</Typography>
        <div id="chart-line">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
            <YAxis tickFormatter={fmt} />
            <Tooltip formatter={(value: any) => fmt(Number(value))} />
              <Legend />
              <Line type="monotone" dataKey="amount" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Paper>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Amount by Category</Typography>
          <div id="chart-bar">
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={barData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis tickFormatter={fmt} />
                    <Tooltip formatter={(value: any) => fmt(Number(value))} />
                    {/* <Legend content={renderCategoryLegend as any} /> */}
                    <Bar dataKey="amount" name="Total Amount">
                        <LabelList
                        dataKey="amount"
                        position="top"
                        content={(props: any) => {
                            const { x, y, value } = props;
                            if (value == null) return null;
                            return (
                            <text x={x} y={y} dy={-6} textAnchor="middle">
                                {fmt(Number(value))}
                            </text>
                            );
                        }}
                        />
                        {barData.map((d, i) => (
                            <Cell key={i} fill={colorFor(d.category, CATEGORY_COLORS)} />
                        ))}
                    </Bar>

                </BarChart>

            </ResponsiveContainer>
          </div>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Share by Region</Typography>
          <div id="chart-pie">
            <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                    <Tooltip formatter={(value: any) => fmt(Number(value))} />
                    <Legend content={renderRegionLegend as any} />
                    <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        outerRadius={90}
                        label={({ name, value }) => `${name}: ${fmt(Number(value))}`}
                    >
                        {pieData.map((d, i) => (
                        <Cell key={i} fill={colorFor(d.name, REGION_COLORS)} />
                        ))}
                    </Pie>
                </PieChart>

            </ResponsiveContainer>
          </div>
        </Paper>
      </Box>
    </Stack>
  );
}
