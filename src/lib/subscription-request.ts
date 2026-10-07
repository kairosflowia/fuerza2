import type { SubscriptionFrequency } from "@/lib/subscriptions-domain";

const FREQUENCIES: SubscriptionFrequency[] = ["weekly", "biweekly", "every_3_weeks", "monthly"];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type PlanRequest = {
  items: { variant_id: string; quantity: number }[];
  pickupPointId: string;
  weekdays: number[];
  frequency: SubscriptionFrequency;
  preferences: { wantsNewBreads: boolean; allowSubstitution: boolean; note: string | null };
};

/**
 * Valida la forma del pedido del configurador antes de llamar a la base de
 * datos. Las reglas de negocio (producto suscribible, disponibilidad, días
 * del punto…) las aplica plan_subscription_basket() en Postgres.
 */
export function parsePlanRequest(body: unknown): PlanRequest | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!Array.isArray(b.items) || !b.items.length || b.items.length > 30) return null;
  const items = b.items.map((item) => {
    const i = item as Record<string, unknown>;
    return { variant_id: String(i?.variant_id ?? ""), quantity: Number(i?.quantity) };
  });
  if (items.some((i) => !UUID.test(i.variant_id) || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 20)) return null;
  if (typeof b.pickupPointId !== "string" || !UUID.test(b.pickupPointId)) return null;
  if (!Array.isArray(b.weekdays) || !b.weekdays.length) return null;
  const weekdays = [...new Set(b.weekdays.map(Number))].sort((x, y) => x - y);
  if (weekdays.some((d) => !Number.isInteger(d) || d < 1 || d > 7)) return null;
  const frequency = (FREQUENCIES as string[]).includes(String(b.frequency)) ? (b.frequency as SubscriptionFrequency) : "weekly";
  const p = (b.preferences ?? {}) as Record<string, unknown>;
  const note = typeof p.note === "string" ? p.note.trim().slice(0, 500) : "";
  return {
    items,
    pickupPointId: b.pickupPointId,
    weekdays,
    frequency,
    preferences: { wantsNewBreads: p.wantsNewBreads === true, allowSubstitution: p.allowSubstitution === true, note: note || null },
  };
}
