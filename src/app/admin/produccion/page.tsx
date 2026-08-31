import Link from "next/link";
import { generateProduction, updateBatch } from "./actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { IconBadge, Metric } from "@/components/admin/analytics-view";
import { PrintButton } from "@/components/admin/print-button";
import { ProductionTabs } from "@/components/admin/production-tabs";
import { Alert, Badge, Button, EmptyState } from "@/components/ui";
import { OvenIcon } from "@/components/ui/icons";
import { BATCH_STATUS, BATCH_STATUS_OPTIONS, loadProductionDay, nextBatchAction } from "@/lib/production-batches";
import { formatIsoDateEs, isoToday, shiftIsoDate } from "@/lib/production-date";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ProductionPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const today = isoToday();
  const date = (await searchParams).fecha ?? today;
  const db: any = await createClient();
  const { batches: numberedBatches, orders, incidents, allocationsByBatch, total, packedPct, groups } = await loadProductionDay(db, date);

  return (
    <>
      <AdminPageHeader
        title="Producción"
        description="Trabajo confirmado y pagado, convertido en lotes ejecutables."
        actions={
          <div className="admin-action-group">
            {numberedBatches.length ? (
              <form action={generateProduction}>
                <input type="hidden" name="date" value={date} />
                <button type="submit" className="button button--secondary">Reconciliar lotes</button>
              </form>
            ) : null}
            <Link className="button button--secondary" href={`/modo-produccion?fecha=${date}`}>Modo producción</Link>
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
        <Metric label="Unidades a producir" value={String(total)} icon="produccion" tone="primary" />
        <Metric label="Pedidos" value={String(orders.length)} icon="pedidos" tone="primary" />
        <Metric label="Suscripciones" value={String(orders.filter((order: any) => order.order_type === "subscription").length)} icon="suscripciones" tone="neutral" />
        <Metric label="Lotes" value={String(numberedBatches.length)} icon="inventario" tone="neutral" />
        <article className="analytics-metric">
          <IconBadge icon="listo" tone="success" />
          <div>
            <p>Embalado</p>
            <strong>{packedPct}%</strong>
            <div className="production-metrics__progress"><div style={{ width: `${packedPct}%` }} /></div>
          </div>
        </article>
      </section>

      {incidents.length ? (
        <Alert variant="warning" title={`${incidents.length} incidencia${incidents.length === 1 ? "" : "s"} abierta${incidents.length === 1 ? "" : "s"}`}>
          Necesitan atención antes de cerrar el día. <Link href={`/admin/produccion/incidencias?fecha=${date}`}>Ver incidencias</Link>
        </Alert>
      ) : null}

      {numberedBatches.length ? (
        <div className="production-batches">
          {[...groups.entries()].map(([family, familyBatches]) => (
            <section className="production-batch-group" key={family}>
              <h2>{family}</h2>
              <div className="production-grid">
                {familyBatches.map((batch: any) => {
                  const status = BATCH_STATUS[batch.status] ?? BATCH_STATUS.planned;
                  const next = nextBatchAction(batch);
                  const target = batch.adjusted_quantity ?? batch.planned_quantity;
                  const pct = target ? Math.min(100, Math.round((batch.packed_quantity / target) * 100)) : 0;
                  const batchAllocations = allocationsByBatch.get(batch.id) ?? [];
                  return (
                    <article className="production-card" key={batch.id}>
                      <div className="production-card__header">
                        <div>
                          <p className="production-card__name">{batch.product_variants?.products?.name}</p>
                          <p className="production-card__variant">{batch.product_variants?.name} · Lote #{batch.batchNumber}</p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>

                      <p className="production-card__qty">{target}<span> uds.</span></p>

                      <div className="production-metrics__progress"><div style={{ width: `${pct}%` }} /></div>
                      <p className="field__help">{batch.produced_quantity} horneadas · {batch.packed_quantity} embaladas</p>

                      {batchAllocations.length ? (
                        <ul className="production-card__points">
                          {batchAllocations.map((allocation: any) => (
                            <li key={allocation.id}>{allocation.pickup_points?.name}: {allocation.planned_quantity} uds.</li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="production-card__actions">
                        {next ? (
                          <form action={updateBatch}>
                            <input type="hidden" name="id" value={batch.id} />
                            <input type="hidden" name="updatedAt" value={batch.updated_at} />
                            <input type="hidden" name="produced" value={next.produced} />
                            <input type="hidden" name="packed" value={next.packed} />
                            <input type="hidden" name="status" value={next.status} />
                            <input type="hidden" name="notes" value={batch.notes ?? ""} />
                            <Button type="submit" variant="primary">{next.label}</Button>
                          </form>
                        ) : null}
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
                      </div>
                    </article>
                  );
                })}
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
    </>
  );
}
