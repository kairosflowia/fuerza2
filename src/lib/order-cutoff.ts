import { shiftIsoDate } from "@/lib/production-date";

export type CutoffConfig = { daysBefore: number; time: string } | null;

/** Zona horaria operativa del obrador (app_settings.operational.timezone, por defecto en la base de datos). */
export const OPERATIONAL_TIMEZONE = "Europe/Madrid";

function operationalNow(from: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone: OPERATIONAL_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" })
      .formatToParts(from)
      .map((part) => [part.type, part.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, seconds: Number(parts.hour) * 3600 + Number(parts.minute) * 60 + Number(parts.second) };
}

/**
 * Fecha de recogida más próxima ("aaaa-mm-dd") que todavía admite reserva,
 * dado el mínimo de antelación de availability.cutoff_days_before /
 * cutoff_time (Documento funcional §2: mínimo 48h). Es la misma regla que
 * app_private.variant_availability(), invertida y evaluada en la zona
 * horaria del obrador: la primera fecha D tal que (D - daysBefore) a las
 * cutoff_time (hora de Madrid) todavía no haya pasado. Se calcula en Madrid
 * y no en la zona del servidor o del navegador: si no, en un servidor UTC
 * la hora de corte se desplazaba 1–2 h, y en uno con zona +02:00 la fecha
 * salía un día antes al convertirla con toISOString().
 */
export function earliestBookableIsoDate(config: CutoffConfig, from: Date = new Date()): string | null {
  if (!config) return null;
  const [hours = 0, minutes = 0, seconds = 0] = config.time.split(":").map(Number);
  const now = operationalNow(from);
  const beforeCutoff = now.seconds < hours * 3600 + minutes * 60 + seconds;
  return shiftIsoDate(now.date, beforeCutoff ? config.daysBefore : config.daysBefore + 1);
}

/** Hoy en la zona horaria del obrador ("aaaa-mm-dd"). */
export function operationalToday(from: Date = new Date()): string {
  return operationalNow(from).date;
}

export function formatEarliestDate(date: string | null): string {
  if (!date) return "Consulta disponibilidad";
  return formatDateEs(date);
}

/** Formatea una fecha (Date o "aaaa-mm-dd") como "Miércoles, 2 de septiembre". */
export function formatDateEs(date: Date | string): string {
  const value = typeof date === "string" ? new Date(`${date}T00:00:00`) : date;
  const formatted = new Intl.DateTimeFormat("es-ES", { weekday: "long", day: "numeric", month: "long" }).format(value);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function formatLeadTimeLabel(config: CutoffConfig): string {
  if (!config) return "Reservas con antelación mínima";
  return `Reservas con mínimo ${config.daysBefore} día${config.daysBefore === 1 ? "" : "s"} de antelación`;
}

/** Lunes=1 ... domingo=7 (ISO 8601), igual que pickup_point_collection_windows.weekday. */
export function isoWeekday(dateIso: string): number {
  const day = new Date(`${dateIso}T00:00:00Z`).getUTCDay();
  return day === 0 ? 7 : day;
}

/** "10:00:00" -> "10:00" */
export function formatTime(value: string): string {
  return value.slice(0, 5);
}
