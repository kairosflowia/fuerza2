import { NextResponse } from "next/server";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const cell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
export async function GET(request: Request) {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "produccion")) return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const date = new URL(request.url).searchParams.get("fecha");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: "invalid_date" }, { status: 400 });
  const db: any = await createClient();
  const { data } = await db.from("production_batches").select("production_date,planned_quantity,adjusted_quantity,produced_quantity,packed_quantity,status,product_variants(name,products(name))").eq("production_date", date);
  const rows = [["Fecha", "Producto", "Variante", "Planificado", "Ajustado", "Producido", "Embalado", "Estado"], ...(data ?? []).map((row: any) => [row.production_date, row.product_variants?.products?.name, row.product_variants?.name, row.planned_quantity, row.adjusted_quantity, row.produced_quantity, row.packed_quantity, row.status])];
  const csv = `\uFEFF${rows.map((row: unknown[]) => row.map(cell).join(";")).join("\r\n")}`;
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="produccion-${date}.csv"`, "cache-control": "private, no-store" } });
}
