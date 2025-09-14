import dayjs from "dayjs";
import type { FilterState } from "../components/Filters";

export type ParsedRow = {
  date: string;      // YYYY-MM-DD or parseable
  category: string;
  amount: number;
  region: string;
};

export function filterRows(rows: ParsedRow[], f: FilterState) {
  return rows.filter(r => {
    const d = dayjs(r.date);
    if (!d.isValid()) return false;
    if (f.start && d.isBefore(f.start, "day")) return false;
    if (f.end && d.isAfter(f.end, "day")) return false;
    if (f.category !== "All" && r.category !== f.category) return false;
    return true;
  });
}

export function computeKPIs(rows: ParsedRow[]) {
  const total = rows.reduce((sum, r) => sum + (r.amount || 0), 0);

  // monthly average by calendar month present in data
  const byMonth = new Map<string, number>();
  rows.forEach(r => {
    const key = dayjs(r.date).format("YYYY-MM");
    byMonth.set(key, (byMonth.get(key) ?? 0) + r.amount);
  });
  const months = Array.from(byMonth.values());
  const monthlyAvg = months.length ? months.reduce((a, b) => a + b, 0) / months.length : 0;

  // top category by sum
  const byCat = new Map<string, number>();
  rows.forEach(r => byCat.set(r.category, (byCat.get(r.category) ?? 0) + r.amount));
  let topCategory: string | null = null;
  let topVal = -Infinity;
  byCat.forEach((v, k) => { if (v > topVal) { topVal = v; topCategory = k; } });

  return { total, monthlyAvg, topCategory };
}
