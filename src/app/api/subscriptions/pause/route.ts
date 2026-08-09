import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id, resumeDate } = await req.json();
  const client = (await createClient()) as any;
  const { data, error } = await client.rpc("request_subscription_pause", { p_subscription_id: id, p_resume_date: resumeDate ?? null });
  const result = data?.[0];
  if (error || !result?.ok) return NextResponse.json({ error: result?.reason ?? "pause_rejected" }, { status: 400 });

  if (result.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.update(result.stripe_subscription_id, {
        pause_collection: { behavior: "void", resumes_at: resumeDate ? Math.floor(new Date(resumeDate).getTime() / 1000) : undefined },
      });
    } catch {
      // La pausa ya quedó registrada (deja de generar ciclos nuevos); si
      // Stripe falla aquí, se marca para revisión manual del cobro.
      const db = createAdminClient() as any;
      await db.from("subscriptions").update({ requires_attention_reason: "stripe_pause_failed" }).eq("id", id);
    }
  }

  return NextResponse.json({ effective: result.effective, effectiveDate: result.effective_date });
}
