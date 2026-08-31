export type BadgeVariant = "success" | "warning" | "error" | "neutral" | "information";

export const ORDER_STATUS_LABELS_ES: Record<string, string> = {
  draft: "Borrador",
  pending_payment: "Pendiente de pago",
  payment_processing: "Procesando pago",
  confirmed: "Confirmado",
  ready: "Listo para recoger",
  collected: "Recogido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  partially_refunded: "Reembolsado parcialmente",
};

export const PAYMENT_STATUS_LABELS_ES: Record<string, string> = {
  not_started: "No iniciado",
  pending: "Pendiente",
  processing: "Procesando",
  paid: "Pagado",
  failed: "Fallido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  partially_refunded: "Reembolsado parcialmente",
};

export const ORDER_STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  draft: "neutral",
  pending_payment: "warning",
  payment_processing: "warning",
  confirmed: "information",
  ready: "success",
  collected: "success",
  cancelled: "error",
  refunded: "neutral",
  partially_refunded: "neutral",
};

export const PAYMENT_STATUS_BADGE_VARIANT: Record<string, BadgeVariant> = {
  not_started: "neutral",
  pending: "warning",
  processing: "warning",
  paid: "success",
  failed: "error",
  cancelled: "neutral",
  refunded: "neutral",
  partially_refunded: "neutral",
};

export type NextOrderAction = { status: string; label: string; needsManage?: boolean };

// Secuencia operativa del Plano Mestre (Nuevo → Preparando → Listo →
// Entregado) mapeada a public.order_status: la acción de "siguiente etapa"
// que se ofrece en la lista y en el detalle del pedido. "Marcar pagado"
// exige owner/admin porque mark_order_paid_manually() lo comprueba también
// en el servidor (ver src/app/admin/pedidos/actions.ts).
export const ORDER_NEXT_ACTION: Record<string, NextOrderAction> = {
  pending_payment: { status: "paid_manual", label: "Marcar pagado", needsManage: true },
  confirmed: { status: "ready", label: "Marcar listo" },
  ready: { status: "collected", label: "Marcar recogido" },
};

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABELS_ES[status] ?? status;
}

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABELS_ES[status] ?? status;
}
