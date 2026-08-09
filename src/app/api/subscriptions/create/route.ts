import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { stripeRecurringInterval, type SubscriptionFrequency } from "@/lib/subscriptions-domain";

const HABITUAL_COUPON_ID = "fuerza-habitual-5pct";

async function ensureDiscountCoupon() {
  const stripe = getStripe();
  try {
    return await stripe.coupons.retrieve(HABITUAL_COUPON_ID);
  } catch {
    return stripe.coupons.create({ id: HABITUAL_COUPON_ID, percent_off: 5, duration: "forever", name: "Fuerza Habitual (4+ unidades)" });
  }
}

export async function POST(req: Request) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user?.email) return NextResponse.json({ error: "authentication_required" }, { status: 401 });

  const body = await req.json();
  const client = (await createClient()) as any;
  const { data, error } = await client.rpc("create_subscription_basket", {
    p_items: body.items,
    p_pickup_point_id: body.pickupPointId,
    p_weekday: body.weekday,
    p_frequency: body.frequency as SubscriptionFrequency,
    p_window_id: null,
  });
  const candidate = data?.[0];
  if (error || !candidate?.ok) return NextResponse.json({ error: candidate?.reason ?? "capacity_unavailable" }, { status: 400 });

  const db = createAdminClient() as any;
  try {
    const { data: items } = await db
      .from("subscription_items")
      .select("product_name_snapshot,variant_name_snapshot,quantity,unit_price_cents_snapshot")
      .eq("subscription_id", candidate.subscription_id);
    if (!items?.length) throw new Error("empty_basket");

    const stripe = getStripe();
    const { data: local } = await db.from("subscriptions").select("stripe_customer_id").eq("customer_id", user.id).not("stripe_customer_id", "is", null).limit(1).maybeSingle();
    const customer = local?.stripe_customer_id ?? (await stripe.customers.create({ email: user.email, metadata: { fuerza_customer_id: user.id } })).id;

    const recurring = stripeRecurringInterval(body.frequency as SubscriptionFrequency);
    const discounts = candidate.discount_percent > 0 ? [{ coupon: (await ensureDiscountCoupon()).id }] : undefined;

    const subscription = await stripe.subscriptions.create({
      customer,
      items: items.map((item: any) => ({
        price_data: {
          currency: "eur",
          product_data: { name: `${item.product_name_snapshot} — ${item.variant_name_snapshot}` },
          unit_amount: item.unit_price_cents_snapshot,
          recurring,
        },
        quantity: item.quantity,
      })),
      discounts,
      payment_behavior: "default_incomplete",
      payment_settings: { save_default_payment_method: "on_subscription" },
      expand: ["latest_invoice.confirmation_secret"],
      metadata: { fuerza_subscription_id: candidate.subscription_id },
    });

    await db.from("subscriptions").update({ stripe_customer_id: customer, stripe_subscription_id: subscription.id, status: "incomplete" }).eq("id", candidate.subscription_id);
    const invoice = subscription.latest_invoice as any;
    return NextResponse.json({ subscriptionId: candidate.subscription_id, clientSecret: invoice?.confirmation_secret?.client_secret });
  } catch {
    await db.from("subscription_capacity_allocations").delete().eq("source_reference", candidate.subscription_id);
    await db.from("subscription_cycles").update({ status: "failed", capacity_reserved: false, failure_reason: "stripe_not_configured" }).eq("id", candidate.cycle_id);
    return NextResponse.json({ error: "stripe_unavailable" }, { status: 503 });
  }
}
