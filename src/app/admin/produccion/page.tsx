import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PrintButton } from "@/components/admin/print-button";
import { EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { generateProduction, updateBatch } from "./actions";

export const dynamic = "force-dynamic";
const isoToday = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());

export default async function ProductionPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const date = (await searchParams).fecha ?? isoToday();
  const db: any = await createClient();
  const [{ data: batches }, { data: orders }, { data: incidents }, { data: allocations }] = await Promise.all([
    db.from("production_batches").select("*,product_variants(name,products(name))").eq("production_date", date).order("created_at"),
    db.from("orders").select("id,order_type,status,pickup_point_id").eq("collection_date", date).eq("payment_status", "paid").in("status", ["confirmed", "ready", "collected"]),
    db.from("production_incidents").select("id,severity,status").eq("production_date", date).in("status", ["open", "in_progress"]),
    db.from("production_batch_allocations").select("*,pickup_points(name),production_batches!inner(production_date)").eq("production_batches.production_date", date),
  ]);
  const total = (batches ?? []).reduce((sum: number, batch: any) => sum + batch.planned_quantity, 0);
  const packed = (batches ?? []).reduce((sum: number, batch: any) => sum + batch.packed_quantity, 0);
  return <>
    <AdminPageHeader title="Producción" description="Trabajo confirmado y pagado, convertido en lotes ejecutables." />
    <form method="get" className="production-toolbar"><label>Fecha<input type="date" name="fecha" defaultValue={date} /></label><button type="submit">Ver fecha</button></form>
    <nav className="production-links" aria-label="Vistas de producción"><Link href={`/admin/produccion?fecha=${date}`}>Productos</Link><Link href={`/admin/produccion/puntos?fecha=${date}`}>Puntos</Link><Link href={`/admin/produccion/pedidos?fecha=${date}`}>Pedidos</Link><Link href={`/admin/produccion/incidencias?fecha=${date}`}>Incidencias</Link><Link href={`/api/admin/produccion/export?fecha=${date}&tipo=produccion`}>Exportar CSV</Link><PrintButton /></nav>
    <section className="production-metrics" aria-label="Resumen"><article><strong>{total}</strong><span>unidades</span></article><article><strong>{orders?.length ?? 0}</strong><span>pedidos</span></article><article><strong>{orders?.filter((order: any) => order.order_type === "subscription").length ?? 0}</strong><span>subscripciones</span></article><article><strong>{batches?.length ?? 0}</strong><span>lotes</span></article><article><strong>{incidents?.length ?? 0}</strong><span>incidencias</span></article><article><strong>{total ? Math.round(packed / total * 100) : 0}%</strong><span>embalado</span></article></section>
    <form action={generateProduction}><input type="hidden" name="date" value={date} /><button type="submit">Generar o reconciliar lotes</button></form>
    {batches?.length ? <div className="production-grid">{batches.map((batch: any) => <article className="production-card" key={batch.id}>
      <p className="eyebrow">{batch.status}</p><h2>{batch.product_variants?.products?.name}</h2><p>{batch.product_variants?.name}</p>
      <dl><div><dt>Planificado</dt><dd>{batch.planned_quantity}</dd></div><div><dt>Ajustado</dt><dd>{batch.adjusted_quantity ?? "—"}</dd></div><div><dt>Producido</dt><dd>{batch.produced_quantity}</dd></div><div><dt>Embalado</dt><dd>{batch.packed_quantity}</dd></div></dl>
      <form action={updateBatch}><input type="hidden" name="id" value={batch.id}/><input type="hidden" name="updatedAt" value={batch.updated_at}/><label>Producido<input name="produced" type="number" min="0" defaultValue={batch.produced_quantity}/></label><label>Embalado<input name="packed" type="number" min="0" defaultValue={batch.packed_quantity}/></label><label>Estado<select name="status" defaultValue={batch.status}>{["planned","in_progress","produced","packed","completed","requires_attention"].map(status=><option key={status}>{status}</option>)}</select></label><label>Nota<textarea name="notes" defaultValue={batch.notes ?? ""}/></label><button type="submit">Guardar lote</button></form>
    </article>)}</div> : <EmptyState title="No hay lotes para esta fecha" description="Genera los lotes después de que existan pedidos confirmados y pagados." />}
    {allocations?.length ? <section className="print-section"><h2>Distribución por punto</h2><ul>{allocations.map((allocation: any) => <li key={allocation.id}>{allocation.pickup_points?.name}: {allocation.planned_quantity} unidades · {allocation.status}</li>)}</ul></section> : null}
  </>;
}
