import "server-only";

import { redirect } from "next/navigation";

import type { RepeatableItem } from "@/components/account/repeat-order-button";
import { getCurrentIdentity } from "@/lib/auth/session";
import { isoWeekday, operationalToday } from "@/lib/order-cutoff";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionFrequency } from "@/lib/subscriptions-domain";

/** Pedidos que el cliente todavía va a recoger. */
const UPCOMING_STATUSES = ["confirmed", "ready"];
/** Un plan "vigente" para mostrar en la cuenta, por orden de relevancia. */
const PLAN_STATUS_ORDER = ["active", "trialing", "requires_attention", "past_due", "paused", "cancel_pending", "incomplete"];

export type AccountOrder = {
  id: string;
  publicCode: string;
  status: string;
  collectionDate: string;
  totalCents: number;
  currency: string;
  pickupPointId: string | null;
  pointName: string | null;
  pointAddress: string | null;
  window: { startsAt: string; endsAt: string } | null;
  items: { name: string; variantName: string; quantity: number; unitPriceCents: number; lineTotalCents: number }[];
  imagePath: string | null;
  repeatItems: RepeatableItem[];
};

export type AccountPlan = {
  id: string;
  status: string;
  frequency: SubscriptionFrequency;
  weekdays: number[];
  nextCollectionDate: string | null;
  totalCents: number;
  pointName: string | null;
  items: { name: string; quantity: number }[];
  imagePath: string | null;
};

export function initialsFor(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((part) => part[0]).join("") || "?").toUpperCase();
}

/** Sesión obligatoria para toda la zona de cuenta. */
export async function requireAccount(next: string) {
  if (!isSupabaseConfigured()) redirect("/cuenta/acceder");
  const identity = await getCurrentIdentity();
  if (!identity) redirect(`/cuenta/acceder?next=${encodeURIComponent(next)}`);
  const fullName = identity.profile?.full_name ?? "";
  return {
    identity,
    userId: identity.user.id,
    email: identity.user.email ?? "",
    fullName,
    phone: identity.profile?.phone ?? "",
    initials: initialsFor(fullName, identity.user.email ?? ""),
  };
}

/**
 * Pedidos del cliente con lo necesario para la cuenta: punto (vía la vista
 * pública, porque pickup_points tiene RLS de equipo), franja de recogida de
 * ese día, panes, imagen y lo que se puede "repetir" hoy.
 */
export async function loadAccountOrders(userId: string, options: { limit?: number; orderId?: string } = {}): Promise<AccountOrder[]> {
  const db = await createClient();
  let query = db
    .from("orders")
    .select("id,public_code,status,collection_date,total_cents,currency,pickup_point_id")
    .eq("customer_id", userId)
    .not("status", "eq", "draft")
    .order("collection_date", { ascending: false });
  if (options.orderId) query = query.eq("id", options.orderId);
  if (options.limit) query = query.limit(options.limit);
  const { data: orders } = await query;
  if (!orders?.length) return [];

  const orderIds = orders.map((o) => o.id);
  const pointIds = [...new Set(orders.map((o) => o.pickup_point_id).filter(Boolean))] as string[];
  const [{ data: items }, { data: points }, { data: windows }] = await Promise.all([
    db.from("order_items").select("order_id,product_id,product_variant_id,product_name_snapshot,variant_name_snapshot,quantity,unit_price_cents,line_total_cents").in("order_id", orderIds),
    pointIds.length ? db.from("pickup_points_public").select("id,name,address_line_1,city").in("id", pointIds) : Promise.resolve({ data: [] as { id: string; name: string; address_line_1: string | null; city: string | null }[] }),
    pointIds.length ? db.from("pickup_point_collection_windows_public").select("pickup_point_id,weekday,starts_at,ends_at").in("pickup_point_id", pointIds) : Promise.resolve({ data: [] as { pickup_point_id: string; weekday: number; starts_at: string; ends_at: string }[] }),
  ]);

  const variantIds = [...new Set((items ?? []).map((i) => i.product_variant_id))];
  const productIds = [...new Set((items ?? []).map((i) => i.product_id).filter((id): id is string => Boolean(id)))];
  const [{ data: variants }, { data: images }] = await Promise.all([
    variantIds.length ? db.from("product_variants").select("id,price_cents,status").in("id", variantIds) : Promise.resolve({ data: [] as { id: string; price_cents: number | null; status: string }[] }),
    productIds.length ? db.from("product_images").select("product_id,storage_path,is_primary").in("product_id", productIds) : Promise.resolve({ data: [] as { product_id: string; storage_path: string; is_primary: boolean }[] }),
  ]);
  const imageFor = (productId: string | null) =>
    productId ? ((images ?? []).find((i) => i.product_id === productId && i.is_primary) ?? (images ?? []).find((i) => i.product_id === productId))?.storage_path ?? null : null;

  return orders.map((order) => {
    const orderItems = (items ?? []).filter((i) => i.order_id === order.id);
    const point = (points ?? []).find((p) => p.id === order.pickup_point_id);
    const window = (windows ?? []).find((w) => w.pickup_point_id === order.pickup_point_id && w.weekday === isoWeekday(order.collection_date));
    // "Repetir pedido": solo pedidos que llegaron a confirmarse y solo variantes que siguen activas y con precio.
    const repeatItems: RepeatableItem[] =
      order.status === "cancelled"
        ? []
        : orderItems.flatMap((item) => {
            const variant = (variants ?? []).find((v) => v.id === item.product_variant_id);
            if (!variant || variant.status !== "active" || variant.price_cents === null) return [];
            return [{ variantId: item.product_variant_id, productName: item.product_name_snapshot, variantName: item.variant_name_snapshot, quantity: item.quantity, priceCents: variant.price_cents, image: imageFor(item.product_id) ?? undefined }];
          });
    return {
      id: order.id,
      publicCode: order.public_code,
      status: order.status,
      collectionDate: order.collection_date,
      totalCents: order.total_cents,
      currency: order.currency,
      pickupPointId: order.pickup_point_id,
      pointName: point?.name ?? null,
      pointAddress: point ? [point.address_line_1, point.city].filter(Boolean).join(", ") || null : null,
      window: window ? { startsAt: window.starts_at, endsAt: window.ends_at } : null,
      items: orderItems.map((i) => ({ name: i.product_name_snapshot, variantName: i.variant_name_snapshot, quantity: i.quantity, unitPriceCents: i.unit_price_cents, lineTotalCents: i.line_total_cents })),
      imagePath: imageFor(orderItems[0]?.product_id ?? null),
      repeatItems,
    };
  });
}

/** Próximas recogidas (de hoy en adelante, en la zona del obrador), la más cercana primero. */
export function upcomingOrders(orders: AccountOrder[]) {
  const today = operationalToday();
  return orders
    .filter((o) => UPCOMING_STATUSES.includes(o.status) && o.collectionDate >= today)
    .sort((a, b) => a.collectionDate.localeCompare(b.collectionDate));
}

type PlanRow = {
  id: string;
  status: string;
  frequency: SubscriptionFrequency;
  preferred_weekdays: number[] | null;
  next_collection_date: string | null;
  total_cents: number;
  pickup_point_id: string | null;
  subscription_items: { product_variant_id: string; product_name_snapshot: string; quantity: number }[] | null;
  subscription_cycles: { collection_date: string; status: string }[] | null;
};

/** El Plan de Pan más relevante del cliente (activo antes que pausado, etc.). */
export async function loadAccountPlan(userId: string): Promise<AccountPlan | null> {
  // subscriptions no está en los tipos generados a mano del proyecto: se tipa aquí la forma consultada.
  const db = (await createClient()) as unknown as {
    from(table: string): {
      select(columns: string): {
        eq(column: string, value: string): { order(column: string, options: { ascending: boolean }): Promise<{ data: PlanRow[] | null }> };
      };
    };
  };
  const { data: subscriptions } = await db
    .from("subscriptions")
    .select("id,status,frequency,preferred_weekdays,next_collection_date,total_cents,pickup_point_id,subscription_items(product_variant_id,product_name_snapshot,quantity),subscription_cycles(collection_date,status)")
    .eq("customer_id", userId)
    .order("created_at", { ascending: false });
  const plan = (subscriptions ?? [])
    .filter((s) => PLAN_STATUS_ORDER.includes(s.status))
    .sort((a, b) => PLAN_STATUS_ORDER.indexOf(a.status) - PLAN_STATUS_ORDER.indexOf(b.status))[0];
  if (!plan) return null;

  const client = await createClient();
  const variantIds = (plan.subscription_items ?? []).map((i) => i.product_variant_id);
  const [{ data: point }, { data: variants }] = await Promise.all([
    plan.pickup_point_id ? client.from("pickup_points_public").select("name").eq("id", plan.pickup_point_id).maybeSingle() : Promise.resolve({ data: null }),
    variantIds.length ? client.from("product_variants").select("id,product_id").in("id", variantIds) : Promise.resolve({ data: [] as { id: string; product_id: string }[] }),
  ]);
  const productId = (variants ?? [])[0]?.product_id;
  const { data: images } = productId
    ? await client.from("product_images").select("storage_path,is_primary").eq("product_id", productId)
    : { data: [] as { storage_path: string; is_primary: boolean }[] };
  const today = operationalToday();
  const nextCycle = (plan.subscription_cycles ?? [])
    .filter((c) => ["planned", "capacity_reserved", "invoiced", "order_created", "paid"].includes(c.status) && c.collection_date >= today)
    .sort((a, b) => a.collection_date.localeCompare(b.collection_date))[0];

  return {
    id: plan.id,
    status: plan.status,
    frequency: plan.frequency,
    weekdays: plan.preferred_weekdays ?? [],
    nextCollectionDate: nextCycle?.collection_date ?? plan.next_collection_date ?? null,
    totalCents: plan.total_cents,
    pointName: point?.name ?? null,
    items: (plan.subscription_items ?? []).map((i) => ({ name: i.product_name_snapshot, quantity: i.quantity })),
    imagePath: ((images ?? []).find((i) => i.is_primary) ?? (images ?? [])[0])?.storage_path ?? null,
  };
}
