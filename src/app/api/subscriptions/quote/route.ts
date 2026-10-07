import { NextResponse } from "next/server";

import { enforceRateLimit } from "@/lib/security/rate-limit";
import { parsePlanRequest } from "@/lib/subscription-request";
import { createClient } from "@/lib/supabase/server";

/** Vista previa del Plan de Pan: mismo cálculo que la creación, sin reservar nada. */
export async function POST(req: Request) {
  if (!(await enforceRateLimit("subscriptions.quote", 60, 300)).allowed) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  }
  const plan = parsePlanRequest(await req.json().catch(() => null));
  if (!plan) return NextResponse.json({ error: "invalid_request" }, { status: 400 });

  const db = (await createClient()) as any;
  const { data, error } = await db.rpc("quote_subscription_basket", {
    p_items: plan.items,
    p_pickup_point_id: plan.pickupPointId,
    p_weekdays: plan.weekdays,
  });
  const quote = data?.[0];
  if (error || !quote) return NextResponse.json({ error: "quote_unavailable" }, { status: 503 });
  if (!quote.ok) return NextResponse.json({ ok: false, reason: quote.reason });
  return NextResponse.json({
    ok: true,
    collectionDates: quote.collection_dates as string[],
    subtotalCents: quote.subtotal_cents as number,
    discountPercent: Number(quote.discount_percent),
    totalCents: quote.total_cents as number,
    deliveries: quote.deliveries as number,
  });
}
