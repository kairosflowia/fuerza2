import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { enforceRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const rate = await enforceRateLimit("orders.cancel", 6, 900);
  if (!rate.allowed) return NextResponse.json({ error: "too_many_requests" }, { status: 429, headers: { "retry-after": String(rate.retryAfter) } });

  const { code } = await params;
  const body = await req.json().catch(() => ({}));
  const token = typeof body.token === "string" ? body.token : "";
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 300) : null;
  if (token.length < 32) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const hash = createHash("sha256").update(token).digest("hex");
  const db = createAdminClient() as any;
  const { data, error } = await db.rpc("request_order_cancellation", { p_public_code: code, p_lookup_hash: hash, p_reason: reason });
  const result = data?.[0];
  if (error || !result?.ok) return NextResponse.json({ error: result?.reason ?? "not_found" }, { status: 404 });

  if (result.resolution === "refund_due") {
    const { data: order } = await db.from("orders").select("stripe_payment_intent_id").eq("public_code", code).maybeSingle();
    if (order?.stripe_payment_intent_id) {
      try {
        await getStripe().refunds.create({ payment_intent: order.stripe_payment_intent_id });
      } catch {
        // El pedido ya quedó cancelado y el estoque liberado: si Stripe falla aquí,
        // el reembolso queda pendiente de gestión manual, pero la cancelación en sí
        // no se revierte. requires_review ya existe para marcar estos casos.
        await db.from("orders").update({ requires_review: true }).eq("public_code", code);
      }
    }
  }

  return NextResponse.json({ resolution: result.resolution, voucherCode: result.voucher_code ?? null });
}
