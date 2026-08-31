export type CutoffConfig = { daysBefore: number; time: string } | null;

/**
 * Fecha de recogida más próxima que todavía admite reserva, dado el mínimo
 * de antelación configurado en availability.cutoff_days_before/cutoff_time
 * (Documento funcional §2: mínimo 48h). Misma fórmula que
 * app_private.variant_availability() en el servidor, invertida: aquí se
 * busca la primera fecha D tal que (D - daysBefore) a las cutoff_time
 * todavía no haya pasado.
 */
export function earliestBookableDate(config: CutoffConfig, from: Date = new Date()): Date | null {
  if (!config) return null;
  const [hours, minutes] = config.time.split(":").map(Number);
  const todayCutoff = new Date(from);
  todayCutoff.setHours(hours, minutes, 0, 0);
  const daysBefore = from < todayCutoff ? config.daysBefore : config.daysBefore + 1;
  const earliest = new Date(from);
  earliest.setDate(earliest.getDate() + daysBefore);
  earliest.setHours(0, 0, 0, 0);
  return earliest;
}

export function formatEarliestDate(date: Date | null): string {
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
