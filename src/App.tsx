import { useEffect, useMemo, useState } from "react";
import { CssBaseline, Container, AppBar, Toolbar, Typography, Stack, Paper } from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { CSVUploader } from "./components/CSVUploader";
import { Filters } from "./components/Filters";
import type { FilterState } from "./components/Filters";
import { KPI } from "./components/KPI";
import { Charts } from "./components/Charts";
import { filterRows, computeKPIs } from "./utils/csv";
import type { ParsedRow } from "./utils/csv";
import { exportDashboardPdf } from "./utils/pdf";
import Papa from "papaparse";

export default function App() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [filters, setFilters] = useState<FilterState>({ start: null, end: null, category: "All" });

  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const kpi = useMemo(() => computeKPIs(filtered), [filtered]);

  useEffect(() => {
    fetch("/docs/sample.csv")
      .then(res => res.text())
      .then(text => {
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          complete: (result) => {
            const parsed: ParsedRow[] = (result.data as any[]).map(r => ({
              date: r.date,
              category: r.category,
              amount: Number(r.amount),
              region: r.region
            }));
            setRows(parsed);
          }
        });
      });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Data Dashboard</Typography>
          <Typography
            role="button"
            onClick={() => setMode(m => (m === "light" ? "dark" : "light"))}
            sx={{ cursor: "pointer" }}
          >
            {mode === "light" ? "Dark" : "Light"}
          </Typography>
        </Toolbar>
      </AppBar>

          <Paper sx={{ p: 2 }}>
            Hello... This is a sample data dashboard application. You can upload your CSV file using the button below, and then apply filters to visualize the data. The required columns in your CSV file are: date, category, amount, and region.
          </Paper>

      <Container sx={{ py: 3 }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}>
            <CSVUploader onRows={setRows} />
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Filters rows={rows} value={filters} onChange={setFilters} onExport={() => exportDashboardPdf(filtered, kpi)} />
          </Paper>

          <KPI total={kpi.total} monthlyAvg={kpi.monthlyAvg} topCategory={kpi.topCategory} />

          <Paper sx={{ p: 2 }}>
            <Charts rows={filtered} />
          </Paper>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
