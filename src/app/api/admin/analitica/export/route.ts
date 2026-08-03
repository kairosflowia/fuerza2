import { NextResponse } from "next/server";
import { getCurrentIdentity } from "@/lib/auth/session";
import { resolveAnalyticsPeriod, rowsToCsv } from "@/lib/analytics";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity?.roles.some(role=>role==="owner"||role==="admin")) return NextResponse.json({ error:"forbidden" },{ status:403 });
  const url = new URL(request.url), type = url.searchParams.get("tipo") ?? "ventas";
  const allowed = new Set(["ventas","encomendas","productos","produccion","suscripciones","puntos","incidencias"]);
  if (!allowed.has(type)) return NextResponse.json({ error:"invalid_export" },{ status:400 });
  const period = resolveAnalyticsPeriod("custom",url.searchParams.get("desde")??undefined,url.searchParams.get("hasta")??undefined);
  const db:any = await createClient();
  const { data,error } = await db.rpc("get_business_analytics",{ p_start:period.start,p_end:period.end,p_pickup_point_id:null,p_product_id:null,p_origin:null });
  if(error) return NextResponse.json({ error:"analytics_unavailable" },{ status:500 });
  let headers=["Métrica","Valor"],rows:unknown[][]=[];
  if(type==="productos") { headers=["Producto","Variante","Unidades","Ingresos EUR","Venta suelta","Plan de Pan"]; rows=(data.products??[]).map((r:any)=>[r.product_name_snapshot,r.variant_name_snapshot,r.units,(r.revenue_cents/100).toFixed(2),r.one_off_units,r.subscription_units]); }
  else if(type==="puntos") { headers=["Punto","Pedidos","Unidades","Ingresos EUR"]; rows=(data.points??[]).map((r:any)=>[r.point_name,r.orders,r.units,(r.revenue_cents/100).toFixed(2)]); }
  else if(type==="incidencias") { headers=["Tipo","Severidad","Total"]; rows=(data.incidents??[]).map((r:any)=>[r.type,r.severity,r.total]); }
  else if(type==="suscripciones") rows=Object.entries(data.subscriptions??{});
  else if(type==="produccion") rows=Object.entries(data.production??{});
  else if(type==="encomendas") rows=Object.entries(data.orders_by_status??{});
  else rows=Object.entries(data.financial??{});
  return new NextResponse(rowsToCsv(headers,rows),{ headers:{ "content-type":"text/csv; charset=utf-8", "content-disposition":`attachment; filename="fuerza-${type}-${period.start}-${period.end}.csv"`, "cache-control":"private, no-store" } });
}
