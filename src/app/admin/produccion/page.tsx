import Link from "next/link";
import { generateProduction, updateBatch } from "./actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PrintButton } from "@/components/admin/print-button";
import { ProductionTabs } from "@/components/admin/production-tabs";
import { Badge, EmptyState } from "@/components/ui";
import { OvenIcon } from "@/components/ui/icons";
import { formatIsoDateEs, isoToday, shiftIsoDate } from "@/lib/production-date";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const BATCH_STATUS: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "error" }> = {
  planned: { label: "Pendiente", variant: "neutral" },
  in_progress: { label: "En horno", variant: "warning" },
  produced: { label: "Listo", variant: "success" },
  packed: { label: "Listo", variant: "success" },
  completed: { label: "Listo", variant: "success" },
  requires_attention: { label: "Atención", variant: "error" },
  cancelled: { label: "Cancelado", variant: "neutral" },
};
const BATCH_STATUS_OPTIONS = ["planned", "in_progress", "produced", "packed", "completed", "requires_attention", "cancelled"];

export default async function ProductionPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const today = isoToday();
  const date = (await searchParams).fecha ?? today;
  const db: any = await createClient();
  const [{ data: batches }, { data: orders }, { data: incidents }, { data: allocations }] = await Promise.all([
    db.from("production_batches").select("*,product_variants(name,products(name,product_families(name)))").eq("production_date", date).order("created_at"),
    db.from("orders").select("id,order_type,status,pickup_point_id").eq("collection_date", date).eq("payment_status", "paid").in("status", ["confirmed", "ready", "collected"]),
    db.from("production_incidents").select("id,severity,status").eq("production_date", date).in("status", ["open", "in_progress"]),
    db.from("production_batch_allocations").select("*,pickup_points(name),production_batches!inner(production_date)").eq("production_batches.production_date", date),
  ]);
  const total = (batches ?? []).reduce((sum: number, batch: any) => sum + batch.planned_quantity, 0);
  const packed = (batches ?? []).reduce((sum: number, batch: any) => sum + batch.packed_quantity, 0);
  const packedPct = total ? Math.round((packed / total) * 100) : 0;

  const numberedBatches = (batches ?? []).map((batch: any, index: number) => ({ ...batch, batchNumber: index + 1 }));
  const groups = new Map<string, typeof numberedBatches>();
  for (const batch of numberedBatches) {
    const family = batch.product_variants?.products?.product_families?.name ?? "Sin familia";
    groups.set(family, [...(groups.get(family) ?? []), batch]);
  }

  return (
    <>
      <AdminPageHeader
        title="Producción"
        description="Trabajo confirmado y pagado, convertido en lotes ejecutables."
        actions={
          <div className="admin-action-group">
            <Link className="button button--secondary" href={`/api/admin/produccion/export?fecha=${date}&tipo=produccion`}>Exportar CSV</Link>
            <PrintButton />
          </div>
        }
      />
      <ProductionTabs date={date} />
      <div className="production-datebar" aria-label="Selector de fecha">
        <Link className="production-datebar__nav" href={`?fecha=${shiftIsoDate(date, -1)}`} aria-label="Día anterior">‹</Link>
        <div className="production-datebar__current">
          {date === today ? (
            <strong>Hoy · {formatIsoDateEs(date)}</strong>
          ) : (
            <>
              <strong>{formatIsoDateEs(date)}</strong>
              <Link href={`?fecha=${today}`}>Volver a hoy</Link>
            </>
          )}
        </div>
        <Link className="production-datebar__nav" href={`?fecha=${shiftIsoDate(date, 1)}`} aria-label="Día siguiente">›</Link>
        <form method="get" className="production-datebar__picker">
          <input type="date" name="fecha" defaultValue={date} />
          <button type="submit" className="button button--secondary">Ir</button>
        </form>
      </div>

      <section className="production-metrics" aria-label="Resumen de carga de trabajo">
        <article><strong>{total}</strong><span>Unidades</span></article>
        <article><strong>{orders?.length ?? 0}</strong><span>Pedidos</span></article>
        <article><strong>{orders?.filter((order: any) => order.order_type === "subscription").length ?? 0}</strong><span>Suscripciones</span></article>
        <article><strong>{batches?.length ?? 0}</strong><span>Lotes</span></article>
        <article><strong>{incidents?.length ?? 0}</strong><span>Incidencias</span></article>
        <article>
          <strong>{packedPct}%</strong><span>Embalado</span>
          <div className="production-metrics__progress"><div style={{ width: `${packedPct}%` }} /></div>
        </article>
      </section>

      <div className="production-cta">
        <div>
          <h2>Generar o reconciliar lotes</h2>
          <p>Convierte los pedidos confirmados y pagados del corte de las 20:00h en lotes ejecutables para el obrador.</p>
        </div>
        <form action={generateProduction}>
          <input type="hidden" name="date" value={date} />
          <button type="submit" className="button button--primary">Generar lotes</button>
        </form>
      </div>

      {numberedBatches.length ? (
        <div className="production-batches">
          {[...groups.entries()].map(([family, familyBatches]) => (
            <section className="production-batch-group" key={family}>
              <h2>{family}</h2>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr><th>Producto</th><th>Unidades a hornear</th><th>Lote #</th><th>Estado</th><th>Acciones</th></tr>
                  </thead>
                  <tbody>
                    {familyBatches.map((batch: any) => {
                      const status = BATCH_STATUS[batch.status] ?? BATCH_STATUS.planned;
                      return (
                        <tr key={batch.id}>
                          <td>
                            <p className="admin-product-cell__name">{batch.product_variants?.products?.name}</p>
                            <p className="admin-product-cell__family">{batch.product_variants?.name}</p>
                          </td>
                          <td>{batch.adjusted_quantity ?? batch.planned_quantity}</td>
                          <td>#{batch.batchNumber}</td>
                          <td><Badge variant={status.variant}>{status.label}</Badge></td>
                          <td>
                            <details className="admin-accordion admin-accordion--inline">
                              <summary>Editar</summary>
                              <div className="admin-accordion__body">
                                <form className="production-batch-edit" action={updateBatch}>
                                  <input type="hidden" name="id" value={batch.id} />
                                  <input type="hidden" name="updatedAt" value={batch.updated_at} />
                                  <label>Producido<input name="produced" type="number" min="0" defaultValue={batch.produced_quantity} /></label>
                                  <label>Embalado<input name="packed" type="number" min="0" defaultValue={batch.packed_quantity} /></label>
                                  <label>Estado<select name="status" defaultValue={batch.status}>{BATCH_STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}</select></label>
                                  <label>Nota<textarea name="notes" defaultValue={batch.notes ?? ""} /></label>
                                  <button type="submit" className="button button--secondary">Guardar lote</button>
                                </form>
                              </div>
                            </details>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={OvenIcon}
          className="state--card"
          title="No hay lotes para esta fecha"
          description="Genera los lotes después de que existan pedidos confirmados y pagados."
          action={
            <form action={generateProduction}>
              <input type="hidden" name="date" value={date} />
              <button type="submit" className="button button--primary">Generar lotes de horneado</button>
            </form>
          }
        />
      )}

      {allocations?.length ? (
        <section className="print-section">
          <h2>Distribución por punto</h2>
          <ul>{allocations.map((allocation: any) => <li key={allocation.id}>{allocation.pickup_points?.name}: {allocation.planned_quantity} unidades · {allocation.status}</li>)}</ul>
        </section>
      ) : null}
    </>
  );
}
