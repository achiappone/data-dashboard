// src/utils/pdf.ts
import dayjs from "dayjs";
import type { ParsedRow } from "./csv";
import type { TDocumentDefinitions, Content, StyleDictionary } from "pdfmake/interfaces";

// Capture charts as PNG data URLs
async function capture(selector: string): Promise<string | null> {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) return null;

  const canvas = el.querySelector("canvas") as HTMLCanvasElement | null;
  if (canvas) return canvas.toDataURL("image/png");

  const svg = el.querySelector("svg") as SVGSVGElement | null;
  if (!svg) return null;

  const xml = new XMLSerializer().serializeToString(svg);
  const svg64 = window.btoa(unescape(encodeURIComponent(xml)));
  const image64 = "data:image/svg+xml;base64," + svg64;

  const img = new Image();
  img.src = image64;
  await new Promise<void>((res) => { img.onload = () => res(); });

  const c = document.createElement("canvas");
  c.width = svg.viewBox.baseVal.width || svg.clientWidth || 800;
  c.height = svg.viewBox.baseVal.height || svg.clientHeight || 400;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(img, 0, 0);
  return c.toDataURL("image/png");
}

export async function exportDashboardPdf(
  rows: ParsedRow[],
  kpi: { total: number; monthlyAvg: number; topCategory: string | null }
) {
  // 🔽 Lazy-load pdfmake only when exporting (prevents blank page)
  const { default: pdfMake } = await import("pdfmake/build/pdfmake");
  // Load fonts for side-effect; it sets window.pdfMake.vfs
  await import("pdfmake/build/vfs_fonts");

  // Read vfs from the global that vfs_fonts created
  const vfs = (window as any).pdfMake?.vfs;
  if (vfs && !pdfMake.vfs) (pdfMake as any).vfs = vfs;

  const linePng = await capture("#chart-line");
  const barPng = await capture("#chart-bar");
  const piePng = await capture("#chart-pie");

  const content: Content[] = [
    { text: "Data Dashboard Report", style: "h1" },
    { text: dayjs().format("YYYY-MM-DD HH:mm"), margin: [0, 0, 0, 10] as [number, number, number, number] },
    { text: "KPIs", style: "h2" },
    {
      columns: [
        { width: "33%", text: `Total: ${kpi.total.toFixed(2)}` },
        { width: "33%", text: `Monthly Avg: ${kpi.monthlyAvg.toFixed(2)}` },
        { width: "33%", text: `Top Category: ${kpi.topCategory ?? "N/A"}` }
      ],
      margin: [0, 0, 0, 10] as [number, number, number, number]
    }
  ];

  if (linePng) {
    content.push({ text: "Amount by Date", style: "h3" });
    content.push({ image: linePng, width: 500, margin: [0, 0, 0, 10] as [number, number, number, number] });
  }
  if (barPng) {
    content.push({ text: "Amount by Category", style: "h3" });
    content.push({ image: barPng, width: 500, margin: [0, 0, 0, 10] as [number, number, number, number] });
  }
  if (piePng) {
    content.push({ text: "Share by Region", style: "h3" });
    content.push({ image: piePng, width: 400 });
  }

  // Optional: include a small sample table (first 15 filtered rows)
  const header = [
    { text: "Date", bold: true },
    { text: "Category", bold: true },
    { text: "Amount", bold: true },
    { text: "Region", bold: true }
  ];
  const body = rows.slice(0, 15).map((r) => [r.date, r.category, r.amount.toFixed(2), r.region || ""]);
  content.push({ text: "Sample Data", style: "h3" });
  content.push({
    table: { headerRows: 1, widths: ["auto", "*", "auto", "auto"], body: [header, ...body] },
    layout: "lightHorizontalLines",
    margin: [0, 6, 0, 0] as [number, number, number, number]
  });

  const styles: StyleDictionary = {
    h1: { fontSize: 18, bold: true, margin: [0, 0, 0, 6] },
    h2: { fontSize: 14, bold: true, margin: [0, 6, 0, 4] },
    h3: { fontSize: 12, bold: true, margin: [0, 6, 0, 4] }
  };

  const docDefinition: TDocumentDefinitions = { content, styles, defaultStyle: { fontSize: 10 } };
  pdfMake.createPdf(docDefinition).download("dashboard_report.pdf");
}
