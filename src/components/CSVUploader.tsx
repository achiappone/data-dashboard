import React, { useRef } from "react";
import Papa from "papaparse";
import type { ParseResult, ParseLocalConfig } from "papaparse";
import { Button, Stack, Typography } from "@mui/material";
import type { ParsedRow } from "../utils/csv";

type Props = {
  onRows: (rows: ParsedRow[]) => void;
  label?: string;
  // NEW props:
  showDownload?: boolean;
  sampleUrl?: string;              // e.g. `${import.meta.env.BASE_URL}docs/sample.csv`
  sampleFilename?: string;         // default "sample.csv"
};

type CsvRow = { date?: string; category?: string; amount?: number | string; region?: string };

export function CSVUploader({
  onRows,
  label = "Upload CSV",
  showDownload = false,
  sampleUrl,
  sampleFilename = "sample.csv",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const inputEl = e.target; // for reset after parse

    const config: ParseLocalConfig<CsvRow, File> = {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results: ParseResult<CsvRow>, _file: File) => {
        const rows: ParsedRow[] = (results.data ?? [])
          .map((r) => ({
            date: String(r.date ?? ""),
            category: String(r.category ?? ""),
            amount: Number(r.amount ?? 0),
            region: String(r.region ?? ""),
          }))
          .filter((r) => r.date && r.category && Number.isFinite(r.amount));

        onRows(rows);
        inputEl.value = "";// allow re-selecting the same filename after edits
      },
    };

    Papa.parse<CsvRow>(file, config);
  };

  return (
  <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
    <input
      ref={inputRef}
      type="file"
      accept=".csv,text/csv"
      onChange={handleChange}
      style={{ display: "none" }}
    />

    {/* Upload button */}
    <Button variant="contained" onClick={() => inputRef.current?.click()}>
      {label}
    </Button>

    {/* Optional download button */}
    {showDownload && sampleUrl && (
      <Button
        component="a"
        href={sampleUrl}
        download={sampleFilename ?? "sample.csv"}
        variant="outlined"
      >
        Download {sampleFilename ?? "sample.csv"}
      </Button>
    )}

    <Typography variant="body2">You may upload your data file here.</Typography>
  </Stack>
);

}
