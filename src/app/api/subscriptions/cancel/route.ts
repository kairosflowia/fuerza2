import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, reason } = await req.json();
  const client = (await createClient()) as any;
  const { data, error } = await client.rpc("request_subscription_cancellation", { p_subscription_id: id, p_reason: reason ?? null });
  const result = data?.[0];
  if (error || !result?.ok) return NextResponse.json({ error: result?.reason ?? "cancellation_rejected" }, { status: 400 });

  if (result.stripe_subscription_id) {
    try {
      const stripe = getStripe();
      if (result.effective === "immediate") await stripe.subscriptions.cancel(result.stripe_subscription_id);
      else await stripe.subscriptions.update(result.stripe_subscription_id, { cancel_at_period_end: true });
    } catch {
      const db = createAdminClient() as any;
      await db.from("subscriptions").update({ requires_attention_reason: "stripe_cancel_failed" }).eq("id", id);
    }
  }

  return NextResponse.json({ effective: result.effective, effectiveDate: result.effective_date });
}
