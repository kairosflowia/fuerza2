import { NextResponse } from "next/server";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "clientes")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const subscriberId = new URL(request.url).searchParams.get("subscriberId");
  if (!subscriberId) return NextResponse.json({ error: "missing_subscriber" }, { status: 400 });

  const db = await createClient();
  const { data, error } = await db.rpc("admin_newsletter_consent_history", { p_subscriber_id: subscriberId });
  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });

  return NextResponse.json({ rows: data ?? [] });
}
