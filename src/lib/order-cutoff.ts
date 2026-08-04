export const ORDER_CUTOFF_HOUR = 20;

export function nextCutoff(from: Date = new Date()): Date {
  const cutoff = new Date(from);
  cutoff.setHours(ORDER_CUTOFF_HOUR, 0, 0, 0);
  if (cutoff.getTime() <= from.getTime()) cutoff.setDate(cutoff.getDate() + 1);
  return cutoff;
}

export function formatCountdown(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, "0")}min`;
}
