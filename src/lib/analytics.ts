export type AnalyticsPeriod = { start: string; end: string; previousStart: string; previousEnd: string };

const madridDate = (date = new Date()) => new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
const shift = (iso: string, days: number) => { const date = new Date(`${iso}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0, 10); };

export function resolveAnalyticsPeriod(preset = "7d", start?: string, end?: string): AnalyticsPeriod {
  const today = madridDate();
  let from = today;
  let to = today;
  if (preset === "yesterday") from = to = shift(today, -1);
  if (preset === "7d") from = shift(today, -6);
  if (preset === "30d") from = shift(today, -29);
  if (preset === "month") from = `${today.slice(0, 8)}01`;
  if (preset === "custom" && /^\d{4}-\d{2}-\d{2}$/.test(start ?? "") && /^\d{4}-\d{2}-\d{2}$/.test(end ?? "")) { from = start!; to = end!; }
  if (from > to || (new Date(to).getTime() - new Date(from).getTime()) / 86_400_000 > 366) { from = shift(today, -6); to = today; }
  const length = Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000) + 1;
  return { start: from, end: to, previousStart: shift(from, -length), previousEnd: shift(from, -1) };
}

export const euro = (cents: number | null | undefined) => new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format((cents ?? 0) / 100);
export const integer = (value: number | null | undefined) => new Intl.NumberFormat("es-ES").format(value ?? 0);

export function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export function rowsToCsv(headers: string[], rows: unknown[][]) {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n")}`;
}
