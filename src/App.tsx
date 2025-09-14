// src/App.tsx
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
import type { ParseResult, ParseConfig } from "papaparse";

// Works locally and on GitHub Pages when vite.config.ts has base: "/data-dashboard/"
// Use BASE_URL so it works locally AND on GitHub Pages (/data-dashboard/)
const csvUrl = `${import.meta.env.BASE_URL}docs/sample.csv`;


type CsvRow = { date: string; category: string; amount: number; region: string };

export default function App() {
  const [mode, setMode] = useState<"light" | "dark">("light");
  const theme = useMemo(() => createTheme({ palette: { mode } }), [mode]);

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [filters, setFilters] = useState<FilterState>({ start: null, end: null, category: "All" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const kpi = useMemo(() => computeKPIs(filtered), [filtered]);

  useEffect(() => {
    let cancelled = false;

    async function loadCsv() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(csvUrl);
        if (!res.ok) throw new Error(`CSV fetch failed: HTTP ${res.status}`);
        const text = await res.text();

        const config: ParseConfig<CsvRow> = {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (result: ParseResult<CsvRow>) => {
            if (cancelled) return;

            // Handle parsing issues via result.errors (since ParseConfig has no 'error' callback type)
            if (result.errors && result.errors.length > 0) {
              setError(result.errors[0].message || "Failed to parse CSV");
              setLoading(false);
              return;
            }

            const parsed: ParsedRow[] = result.data.map((r) => ({
              date: r.date,
              category: String(r.category ?? ""),
              amount: Number(r.amount ?? 0),
              region: String(r.region ?? ""),
            }));

            setRows(parsed);
            setLoading(false);
          },
        };

        Papa.parse<CsvRow>(text, config);
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          typeof e === "object" && e !== null && "message" in e
            ? String((e as { message?: unknown }).message)
            : "Failed to load CSV";
        setError(msg);
        setLoading(false);
      }
    }

    loadCsv();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky">
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Data Dashboard
          </Typography>
          <Typography
            role="button"
            onClick={() => setMode((m) => (m === "light" ? "dark" : "light"))}
            sx={{ cursor: "pointer" }}
          >
            {mode === "light" ? "Dark" : "Light"}
          </Typography>
        </Toolbar>
      </AppBar>

      <Paper sx={{ p: 2 }}>
        This is a sample data dashboard. Upload your CSV below, then use filters to visualize.
        Required columns: date, category, amount, region.
      </Paper>

      <Container sx={{ py: 3 }}>
        <Stack spacing={2}>
          <Paper sx={{ p: 2 }}>
            <CSVUploader onRows={setRows} />
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Filters
              rows={rows}
              value={filters}
              onChange={setFilters}
              onExport={() => exportDashboardPdf(filtered, kpi)}
            />
          </Paper>

          {loading && <Paper sx={{ p: 2 }}>Loading sample data...</Paper>}
          {error && <Paper sx={{ p: 2 }}>Could not load sample data: {error}</Paper>}

          <KPI total={kpi.total} monthlyAvg={kpi.monthlyAvg} topCategory={kpi.topCategory} />

          <Paper sx={{ p: 2 }}>
            <Charts rows={filtered ?? []} />
          </Paper>
        </Stack>
      </Container>
    </ThemeProvider>
  );
}
