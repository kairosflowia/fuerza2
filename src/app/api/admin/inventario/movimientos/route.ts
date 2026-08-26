import { NextResponse } from "next/server";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "inventario")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const variantId = new URL(request.url).searchParams.get("variantId");
  if (!variantId) return NextResponse.json({ error: "missing_variant" }, { status: 400 });

  const db: any = await createClient();
  const { data, error } = await db.rpc("variant_stock_timeline", { p_variant_id: variantId, p_limit: 50 });
  if (error) return NextResponse.json({ error: "query_failed" }, { status: 500 });

  return NextResponse.json({ rows: data ?? [] });
}
