import type { ChangeEvent } from "react";
import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import { Button, Stack, Typography } from "@mui/material";
import type { ParsedRow } from "../utils/csv";

type Props = { onRows: (rows: ParsedRow[]) => void };

export function CSVUploader({ onRows }: Props) {
  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
    complete: (result: ParseResult<any>) => {
        const rows: ParsedRow[] = (result.data as any[]).map((r) => ({
          date: String(r.date),
          category: String(r.category),
          amount: Number(r.amount),
          region: String(r.region || "")
        })).filter(r => r.date && r.category && !isNaN(r.amount));
        onRows(rows);
      }
    });
  };

  return (
    <Stack direction="row" spacing={2} alignItems="center">
      <Button variant="contained" component="label">
        Upload CSV
        <input type="file" accept=".csv" hidden onChange={handleFile} />
      </Button>
      <Typography variant="body2">You may upload your Datafile here. </Typography>
    </Stack>
  );
}
