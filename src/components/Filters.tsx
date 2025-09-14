import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import { Stack, TextField, MenuItem, Button } from "@mui/material";
import type { ParsedRow } from "../utils/csv";

export type FilterState = {
  start: Dayjs | null;
  end: Dayjs | null;
  category: string; // "All" or specific
};

type Props = {
  rows: ParsedRow[];
  value: FilterState;
  onChange: (v: FilterState) => void;
  onExport: () => void;
};

export function Filters({ rows, value, onChange, onExport }: Props) {
  const categories = Array.from(new Set(rows.map(r => r.category)));
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
      <TextField
        label="Start (YYYY-MM-DD)"
        value={value.start ? value.start.format("YYYY-MM-DD") : ""}
        onChange={e => onChange({ ...value, start: e.target.value ? dayjs(e.target.value) : null })}
        placeholder="2025-01-01"
        size="small"
      />
      <TextField
        label="End (YYYY-MM-DD)"
        value={value.end ? value.end.format("YYYY-MM-DD") : ""}
        onChange={e => onChange({ ...value, end: e.target.value ? dayjs(e.target.value) : null })}
        placeholder="2025-12-31"
        size="small"
      />
      <TextField
        select
        label="Category"
        size="small"
        value={value.category}
        onChange={e => onChange({ ...value, category: e.target.value })}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="All">All</MenuItem>
        {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
      </TextField>

      <Button variant="outlined" onClick={onExport}>Export PDF</Button>
    </Stack>
  );
}
