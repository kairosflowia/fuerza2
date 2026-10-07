import { formatTime } from "@/lib/order-cutoff";

/** Lunes=1 … domingo=7 (ISO 8601), igual que la base de datos. */
export const SHORT_DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const dayLabel = (weekday: number) => SHORT_DAYS_ES[weekday - 1];

/**
 * Agrupa días de la semana en tramos consecutivos ("Mar–Sáb", "Dom–Lun"),
 * teniendo en cuenta que la semana es circular (domingo → lunes).
 */
export function formatWeekdayRanges(weekdays: number[], separator = "–"): string {
  const days = [...new Set(weekdays)].filter((d) => d >= 1 && d <= 7).sort((a, b) => a - b);
  if (!days.length) return "";
  if (days.length === 7) return `${dayLabel(1)}${separator}${dayLabel(7)}`;
  // Empieza a contar justo después de un día ausente para no partir un tramo que cruza el domingo.
  const start = days.find((d) => !days.includes(d === 1 ? 7 : d - 1)) ?? days[0];
  const rotated = [...days.filter((d) => d >= start), ...days.filter((d) => d < start)];
  const ranges: number[][] = [];
  for (const day of rotated) {
    const last = ranges.at(-1);
    const previous = last?.at(-1);
    if (last && previous !== undefined && (previous % 7) + 1 === day) last.push(day);
    else ranges.push([day]);
  }
  return ranges
    .map((range) => (range.length >= 2 ? `${dayLabel(range[0])}${separator}${dayLabel(range.at(-1)!)}` : range.map(dayLabel).join(", ")))
    .join(", ");
}

type CollectionWindow = { weekday: number; startsAt: string; endsAt: string };

/** "Mar – Sáb · 10:00 – 14:30" o "Horario según el día" si las franjas difieren. */
export function summarizeCollectionWindows(windows: CollectionWindow[]): string | null {
  if (!windows.length) return null;
  const first = windows[0];
  const sameHours = windows.every((w) => w.startsAt === first.startsAt && w.endsAt === first.endsAt);
  if (!sameHours) return "Horario según el día";
  const days = formatWeekdayRanges(windows.map((w) => w.weekday), " – ");
  return `${days} · ${formatTime(first.startsAt)} – ${formatTime(first.endsAt)}`;
}

type OpeningHour = { weekday: number; opensAt: string | null; closesAt: string | null; isClosed: boolean };

/**
 * Horario del establecimiento agrupado por franjas iguales, más los días
 * cerrados: "Mar–Sáb: 09:00–18:00 · Dom–Lun: Cerrado". Un día sin fila
 * no se da por cerrado: simplemente no se menciona.
 */
export function summarizeOpeningHours(hours: OpeningHour[]): string | null {
  if (!hours.length) return null;
  const groups = new Map<string, number[]>();
  const closed: number[] = [];
  for (const row of hours) {
    if (row.isClosed || !row.opensAt || !row.closesAt) closed.push(row.weekday);
    else {
      const key = `${formatTime(row.opensAt)}–${formatTime(row.closesAt)}`;
      groups.set(key, [...(groups.get(key) ?? []), row.weekday]);
    }
  }
  const parts = [...groups.entries()]
    .sort(([, a], [, b]) => Math.min(...a) - Math.min(...b))
    .map(([range, days]) => `${formatWeekdayRanges(days)}: ${range}`);
  if (closed.length) parts.push(`${formatWeekdayRanges(closed)}: Cerrado`);
  return parts.join(" · ");
}
