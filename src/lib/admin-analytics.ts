import { createClient } from "@/lib/supabase/server";
import { resolveAnalyticsPeriod } from "@/lib/analytics";
import { isoWeekday, WEEKDAY_LABELS_ES } from "@/lib/pickup-points-domain";

export async function loadAnalytics(params: Record<string,string|undefined>) {
  const period = resolveAnalyticsPeriod(params.periodo, params.desde, params.hasta);
  // Generated database types are updated after remote schema generation; this RPC is migration-owned.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = await createClient();
  const args = { p_start: period.start, p_end: period.end, p_pickup_point_id: params.punto || null, p_product_id: params.producto || null, p_origin: params.origen || null };
  const [{ data, error }, { data: previous }, { data: points }, { data: products }, { data: mermaRows }, { data: dayOrders }] = await Promise.all([
    db.rpc("get_business_analytics", args),
    db.rpc("get_business_analytics", { ...args, p_start: period.previousStart, p_end: period.previousEnd }),
    db.from("pickup_points").select("id,name").eq("status","active").order("name"),
    db.from("products").select("id,name").in("status",["active","seasonal"]).order("name"),
    db.from("product_stock_movements").select("quantity").eq("type","merma").gte("created_at",`${period.start}T00:00:00Z`).lte("created_at",`${period.end}T23:59:59Z`),
    db.from("orders").select("collection_date,total_cents").eq("payment_status","paid").gte("collection_date",period.start).lte("collection_date",period.end),
  ]);

  const mermaUnits = (mermaRows ?? []).reduce((sum: number, row: { quantity: number }) => sum + Math.abs(row.quantity), 0);

  // "Perguntas úteis: dias" (Fase 14) -- ventas reales por día de la semana
  // dentro del periodo, calculado aquí en vez de en get_business_analytics()
  // porque esa función solo devuelve totales del periodo, no un desglose.
  const byWeekday = new Map<number, { orders: number; cents: number }>();
  for (const order of dayOrders ?? []) {
    const weekday = isoWeekday(order.collection_date);
    const entry = byWeekday.get(weekday) ?? { orders: 0, cents: 0 };
    entry.orders += 1;
    entry.cents += order.total_cents;
    byWeekday.set(weekday, entry);
  }
  const salesByWeekday = WEEKDAY_LABELS_ES.map((label, index) => {
    const entry = byWeekday.get(index + 1) ?? { orders: 0, cents: 0 };
    return { label, orders: entry.orders, cents: entry.cents };
  });

  return { data, previous, error, period, points: points ?? [], products: products ?? [], mermaUnits, salesByWeekday };
}
