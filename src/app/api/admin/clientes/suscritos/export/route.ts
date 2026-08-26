import { NextResponse } from "next/server";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const cell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const BOM = "﻿";

export async function GET(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "clientes")) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const estado = new URL(request.url).searchParams.get("estado");
  const db = await createClient();
  const { data } = await db.rpc("admin_newsletter_directory", { p_query: null, p_status: estado || null });

  const rows = [
    ["Correo", "Estado", "Origen", "Fecha de alta", "Fecha de confirmación", "Fecha de baja", "Última actividad", "Cliente con cuenta"],
    ...(data ?? []).map((s) => [s.email, s.status, s.source, s.subscribed_at, s.confirmed_at ?? "", s.unsubscribed_at ?? "", s.last_activity_at, s.customer_id ? "Sí" : "No"]),
  ];
  const csv = `${BOM}${rows.map((row) => row.map(cell).join(";")).join("\r\n")}`;
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="suscritos-newsletter.csv"`, "cache-control": "private, no-store" } });
}
