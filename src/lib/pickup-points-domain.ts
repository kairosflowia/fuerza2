import type { Database } from "@/lib/supabase/database.types";

// ---------------------------------------------------------------------------
// Lógica de dominio pura de puntos de recogida y calendario operativo. Sin
// acceso a datos, sin "server-only", importable desde pruebas unitarias.
// Ver Documento 04 §2.3 y §3.3: la lógica evaluativa vive en TypeScript, no
// en funciones de PostgreSQL.
// ---------------------------------------------------------------------------

export const WEEKDAY_LABELS_ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"] as const;

export const PICKUP_POINT_STATUS_LABELS_ES: Record<Database["public"]["Tables"]["pickup_points"]["Row"]["status"], string> = {
  draft: "Borrador",
  active: "Activo",
  temporarily_unavailable: "Temporalmente no disponible",
  coming_soon: "Próximamente",
  inactive: "Inactivo",
};

export const PICKUP_EXCEPTION_TYPE_LABELS_ES: Record<Database["public"]["Tables"]["pickup_point_exceptions"]["Row"]["type"], string> = {
  closed: "Cerrado",
  extraordinary_opening: "Apertura extraordinaria",
  schedule_override: "Horario distinto",
  capacity_override: "Capacidad distinta",
};

/** Convierte una fecha (YYYY-MM-DD) al día de la semana ISO usado en la base de datos: 1=lunes … 7=domingo. */
export function isoWeekday(date: string): number {
  const jsDay = new Date(`${date}T00:00:00Z`).getUTCDay();
  return ((jsDay + 6) % 7) + 1;
}

export interface PublicPickupPointLike {
  is_main_bakery: boolean;
}

export function mainBakery<T extends PublicPickupPointLike>(points: T[]): T | null {
  return points.find((point) => point.is_main_bakery) ?? null;
}

/** Enlace directo a la app de mapas del dispositivo, sin SDK ni cookies de terceros. */
export function directionsUrl(point: { latitude: number | null; longitude: number | null; address_line_1: string | null; city: string | null }) {
  if (point.latitude != null && point.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${point.latitude},${point.longitude}`;
  }
  const parts = [point.address_line_1, point.city].filter(Boolean).join(", ");
  return parts ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts)}` : null;
}

export type PickupPointInvalidReason =
  | "point_not_active"
  | "product_not_accepted"
  | "globally_closed"
  | "point_exception_closed"
  | "no_collection_window"
  | "capacity_not_configured"
  | "capacity_zero";

export interface PickupPointOperationalResult {
  isValid: boolean;
  reason: PickupPointInvalidReason | null;
  collectionWindow: { startsAt: string; endsAt: string } | null;
  /** null cuando no hay capacidad configurada para esa fecha; distinto de 0. */
  capacity: number | null;
}

type PointForEvaluation = Pick<Database["public"]["Tables"]["pickup_points"]["Row"], "status" | "accepts_all_products">;
type WindowRow = Pick<Database["public"]["Tables"]["pickup_point_collection_windows"]["Row"], "weekday" | "starts_at" | "ends_at" | "is_active">;
type CapacityRow = Pick<Database["public"]["Tables"]["pickup_point_capacity_defaults"]["Row"], "weekday" | "max_units">;
type ExceptionRow = Pick<Database["public"]["Tables"]["pickup_point_exceptions"]["Row"], "exception_date" | "type" | "collection_starts_at" | "collection_ends_at" | "capacity_override">;
type ClosureRow = Pick<Database["public"]["Tables"]["global_closures"]["Row"], "starts_on" | "ends_on">;

export interface EvaluatePickupPointInput {
  point: PointForEvaluation;
  date: string;
  windows: WindowRow[];
  capacityDefaults: CapacityRow[];
  exceptions: ExceptionRow[];
  globalClosures: ClosureRow[];
  /** Solo se exige cuando se evalúa para un producto concreto. */
  productId?: string;
  acceptedProductIds?: ReadonlySet<string>;
}

/**
 * Evalúa si un punto es operativamente válido en una fecha, aplicando la
 * precedencia: 1) cierre global, 2) excepción específica del punto,
 * 3) configuración semanal habitual, 4) valor por defecto. No calcula stock
 * ni reservas: esa es la fase siguiente.
 */
export function evaluatePickupPointForDate({
  point,
  date,
  windows,
  capacityDefaults,
  exceptions,
  globalClosures,
  productId,
  acceptedProductIds,
}: EvaluatePickupPointInput): PickupPointOperationalResult {
  const invalid = (reason: PickupPointInvalidReason): PickupPointOperationalResult => ({
    isValid: false,
    reason,
    collectionWindow: null,
    capacity: null,
  });

  // 1. El punto está activo.
  if (point.status !== "active") return invalid("point_not_active");

  // 2. El producto es aceptado en el punto (si se evalúa para un producto).
  if (productId && !point.accepts_all_products && !acceptedProductIds?.has(productId)) {
    return invalid("product_not_accepted");
  }

  // 3. Precedencia 1: cierre global. Vence sobre cualquier configuración del punto.
  const globallyClosed = globalClosures.some((c) => date >= c.starts_on && date <= c.ends_on);
  if (globallyClosed) return invalid("globally_closed");

  // 4. Precedencia 2: excepción específica del punto para esta fecha.
  const exception = exceptions.find((e) => e.exception_date === date) ?? null;
  if (exception?.type === "closed") return invalid("point_exception_closed");

  const weekday = isoWeekday(date);
  let collectionWindow: { startsAt: string; endsAt: string } | null = null;

  if (exception?.type === "extraordinary_opening" || exception?.type === "schedule_override") {
    // La excepción sustituye por completo a la configuración semanal de horas.
    collectionWindow = { startsAt: exception.collection_starts_at!, endsAt: exception.collection_ends_at! };
  } else {
    // 5. Precedencia 3: configuración semanal habitual.
    const activeWindow = windows.find((w) => w.weekday === weekday && w.is_active);
    if (!activeWindow) return invalid("no_collection_window");
    collectionWindow = { startsAt: activeWindow.starts_at, endsAt: activeWindow.ends_at };
  }

  // 6. Capacidad: la excepción de capacidad vence sobre el valor semanal habitual.
  let capacity: number | null;
  if (exception?.type === "capacity_override") {
    capacity = exception.capacity_override;
  } else {
    // 7. Precedencia 4: valor por defecto. Ausencia de fila ≠ cero.
    const defaultRow = capacityDefaults.find((c) => c.weekday === weekday) ?? null;
    capacity = defaultRow ? defaultRow.max_units : null;
  }

  if (capacity === null) return invalid("capacity_not_configured");
  if (capacity === 0) return invalid("capacity_zero");

  return { isValid: true, reason: null, collectionWindow, capacity };
}
