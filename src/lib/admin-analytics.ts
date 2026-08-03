import { createClient } from "@/lib/supabase/server";
import { resolveAnalyticsPeriod } from "@/lib/analytics";

export async function loadAnalytics(params: Record<string,string|undefined>) {
  const period = resolveAnalyticsPeriod(params.periodo, params.desde, params.hasta);
  // Generated database types are updated after remote schema generation; this RPC is migration-owned.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db: any = await createClient();
  const args = { p_start: period.start, p_end: period.end, p_pickup_point_id: params.punto || null, p_product_id: params.producto || null, p_origin: params.origen || null };
  const [{ data, error }, { data: previous }, { data: points }, { data: products }] = await Promise.all([
    db.rpc("get_business_analytics", args),
    db.rpc("get_business_analytics", { ...args, p_start: period.previousStart, p_end: period.previousEnd }),
    db.from("pickup_points").select("id,name").eq("status","active").order("name"),
    db.from("products").select("id,name").in("status",["active","seasonal"]).order("name"),
  ]);
  return { data, previous, error, period, points: points ?? [], products: products ?? [] };
}
