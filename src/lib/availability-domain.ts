export type AvailabilityStatus = "available" | "low_stock" | "sold_out";

/**
 * Motivos de indisponibilidad. Cada uno responde a una pregunta distinta y
 * exige una alternativa concreta en la interfaz (Documento 03 §11.1): nunca
 * un mensaje genérico.
 */
export const AVAILABILITY_REASON_LABELS_ES: Record<string, string> = {
  available: "Disponible",
  product_unavailable: "Este producto no está publicado ahora mismo",
  variant_inactive: "Esta variante no está activa",
  point_inactive: "Este punto no está activo",
  product_not_allowed_at_point: "Este pan no se recoge en este punto",
  no_collection_window: "Este punto no tiene franja de recogida ese día",
  point_capacity_not_configured: "Todavía no hay capacidad configurada para ese día en este punto",
  point_full: "Este punto ya está completo ese día",
  global_closure: "Ese día no horneamos",
  point_closed: "Este punto está cerrado ese día",
  not_produced_that_day: "Este pan no se hornea ese día de la semana",
  production_not_open: "Todavía no hemos abierto pedidos para esa fecha",
  cutoff_passed: "Ya hemos cerrado los pedidos para esa fecha",
  sold_out: "Agotado para esa fecha",
  out_of_stock: "Agotado",
  subscription_capacity_only: "Lo que queda está reservado para el Plan de Pan",
  invalid_quantity: "La cantidad indicada no es válida",
  invalid_session: "No hemos podido identificar la sesión",
  invalid_channel: "Indica un canal válido (WhatsApp, teléfono o presencial)",
  invalid_payment_status: "Indica un estado de pago válido",
  invalid_customer: "Indica nombre y teléfono del cliente",
  invalid_checkout: "Añade al menos un artículo con cantidad válida",
  invalid_email: "Revisa el correo electrónico: no parece válido",
  variant_unavailable: "Esta variante no está publicada o no tiene precio",
  reserved_for_subscribers: "Reservado por ahora para quienes tienen Fuerza Habitual. Pronto se abre para todo el mundo.",
};

export function availabilityReasonLabel(reason: string): string {
  return AVAILABILITY_REASON_LABELS_ES[reason] ?? "No disponible ahora mismo";
}

export interface VariantAvailability {
  status: AvailabilityStatus;
  reason: string;
  quantityAvailable: number | null;
}

export interface PickupPointAvailability {
  pickupPointId: string;
  status: AvailabilityStatus;
  reason: string;
  quantityAvailable: number | null;
}
