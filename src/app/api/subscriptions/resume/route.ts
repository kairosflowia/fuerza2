import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id } = await req.json();
  const client = (await createClient()) as any;
  const { data, error } = await client.rpc("request_subscription_resume", { p_subscription_id: id });
  const result = data?.[0];
  if (error || !result?.ok) return NextResponse.json({ error: result?.reason ?? "resume_rejected" }, { status: 400 });

  if (result.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.update(result.stripe_subscription_id, { pause_collection: null });
    } catch {
      const db = createAdminClient() as any;
      await db.from("subscriptions").update({ requires_attention_reason: "stripe_resume_failed" }).eq("id", id);
    }
  }

  return NextResponse.json({ ok: true });
}
