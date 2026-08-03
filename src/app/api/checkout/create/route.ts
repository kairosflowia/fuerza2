import { createHash, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { enforceRateLimit } from "@/lib/security/rate-limit";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      return NextResponse.json({ error: "invalid_origin" }, { status: 403 });
    }
    const rate=await enforceRateLimit("checkout.create",6,900);if(!rate.allowed)return NextResponse.json({error:"too_many_requests"},{status:429,headers:{"retry-after":String(rate.retryAfter)}});
    const body = await request.json();
    if (!body.terms || !body.privacy || !Array.isArray(body.items) || !body.items.length) return NextResponse.json({ error: "invalid_consents" }, { status: 400 });
    const user = (await (await createClient()).auth.getUser()).data.user;
    const lookup = typeof body.sessionKey === "string" && body.sessionKey.length >= 32 ? body.sessionKey : randomUUID();
    const hash = createHash("sha256").update(lookup).digest("hex");
    const db = createAdminClient() as any;
    const { data, error } = await db.rpc("create_checkout_order", { p_items: body.items, p_pickup_point_id: body.pickupPointId, p_collection_date: body.collectionDate, p_session_key: body.sessionKey ?? randomUUID(), p_customer_id: user?.id ?? null, p_name: body.name, p_email: body.email, p_phone: body.phone, p_terms_version: "2026-08", p_privacy_version: "2026-08", p_marketing: Boolean(body.marketing), p_lookup_hash: hash });
    const result = data?.[0];
    if (error || !result?.ok) return NextResponse.json({ error: result?.reason ?? "checkout_invalid" }, { status: 400 });
    const { data: order } = await db.from("orders").select("reservation_id").eq("id", result.order_id).single();
    const intent = await getStripe().paymentIntents.create({ amount: result.total_cents, currency: "eur", automatic_payment_methods: { enabled: true }, receipt_email: body.email, metadata: { order_id: result.order_id, reservation_id: order?.reservation_id ?? "" } }, { idempotencyKey: `order-${result.order_id}` });
    await db.from("orders").update({ stripe_payment_intent_id: intent.id }).eq("id", result.order_id);
    return NextResponse.json({ clientSecret: intent.client_secret, publicCode: result.public_code, lookupToken: lookup, expiresAt: result.expires_at });
  } catch { return NextResponse.json({ error: "payment_unavailable" }, { status: 503 }); }
}
