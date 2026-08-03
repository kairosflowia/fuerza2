import { NextResponse, type NextRequest } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

/**
 * Tarea agendada: expira reservas vencidas y sinaliza inconsistencias.
 *
 * No es la corrección: la corrección la da la autocuración dentro de
 * create_stock_reservation y check_variant_availability (Documento 06 §7).
 * Esta tarea es higiene y detección temprana, para que ninguna
 * inconsistencia pase desapercibida mucho tiempo.
 *
 * Elegido Vercel Cron por simplicidad: un solo mecanismo, un solo lugar
 * donde mirar (vercel.json), sin infraestructura propia.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, reason: "supabase_not_configured" }, { status: 503 });
  }

  const db = createAdminClient();
  const summary: Record<string, unknown> = {};

  const { data: expiredCount, error: expireError } = await db.rpc("expire_stock_reservations");
  summary.expired_reservations = expireError ? null : expiredCount;
  if (expireError) summary.expire_error = expireError.message;

  const { data: subscriptionJobs, error: subscriptionError } = await (db as never as { rpc(name:string):Promise<{data:unknown;error:{message:string}|null}> }).rpc("run_subscription_jobs");
  summary.subscription_jobs = subscriptionError ? null : subscriptionJobs;
  if (subscriptionError) summary.subscription_error = subscriptionError.message;

  const { data: productionJobs, error: productionError } = await (db as never as { rpc(name:string):Promise<{data:unknown;error:{message:string}|null}> }).rpc("run_production_jobs");
  summary.production_jobs = productionError ? null : productionJobs;
  if (productionError) summary.production_error = productionError.message;

  // Reconciliación mínima: pedidos confirmados sin ninguna línea, que nunca
  // deberían existir si convert_reservation_to_order es la única vía de
  // creación, pero se detectan aquí en vez de asumirlo silenciosamente.
  const { data: confirmedOrders } = await db.from("orders").select("id").eq("status", "confirmed");
  const { data: allItems } = await db.from("order_items").select("order_id");
  const orderIdsWithItems = new Set((allItems ?? []).map((i) => i.order_id));
  const ordersWithoutItems = (confirmedOrders ?? []).filter((o) => !orderIdsWithItems.has(o.id));
  summary.confirmed_orders_without_items = ordersWithoutItems.length;
  if (ordersWithoutItems.length > 0) {
    summary.inconsistent_order_ids = ordersWithoutItems.map((o) => o.id);
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), ...summary });
}
