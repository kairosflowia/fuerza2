import Link from "next/link";
import { redirect } from "next/navigation";

import { updateBatch } from "@/app/admin/produccion/actions";
import { Alert, Badge } from "@/components/ui";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { BATCH_STATUS, loadProductionDay, nextBatchAction } from "@/lib/production-batches";
import { formatIsoDateEs, isoToday, shiftIsoDate } from "@/lib/production-date";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Vista independiente del layout /admin (sin sidebar, sin header administrativo,
// sin filtros ni exportación): pensada para una tablet en el obrador, a
// distancia de lectura, con solo lo necesario para ejecutar el día — marcar
// lotes iniciados/preparados/concluidos. Reutiliza loadProductionDay() y
// updateBatch() sin ningún cálculo ni regla nuevos (Fase 9 del Plano Mestre).
export default async function ProductionKioskPage({ searchParams }: { searchParams: Promise<{ fecha?: string }> }) {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "produccion")) redirect("/cuenta/acceso-denegado");

  const today = isoToday();
  const date = (await searchParams).fecha ?? today;
  const db: any = await createClient();
  const { batches: numberedBatches, incidents, allocationsByBatch, groups } = await loadProductionDay(db, date);

  return (
    <div className="kiosk">
      <header className="kiosk__bar">
        <span className="kiosk__brand">FUERZA <em>obrador</em></span>
        <nav className="kiosk__date" aria-label="Selector de fecha">
          <Link href={`/modo-produccion?fecha=${shiftIsoDate(date, -1)}`} aria-label="Día anterior">‹</Link>
          <strong>{date === today ? `Hoy · ${formatIsoDateEs(date)}` : formatIsoDateEs(date)}</strong>
          <Link href={`/modo-produccion?fecha=${shiftIsoDate(date, 1)}`} aria-label="Día siguiente">›</Link>
        </nav>
        <Link className="kiosk__exit" href={`/admin/produccion?fecha=${date}`}>Salir</Link>
      </header>

      {incidents.length ? (
        <div className="kiosk__alert">
          <Alert variant="warning" title={`${incidents.length} incidencia${incidents.length === 1 ? "" : "s"} abierta${incidents.length === 1 ? "" : "s"}`}>
            Revísalas desde el panel de administración.
          </Alert>
        </div>
      ) : null}

      <main className="kiosk__main">
        {numberedBatches.length ? (
          [...groups.entries()].map(([family, familyBatches]: [string, any[]]) => (
            <section className="kiosk-group" key={family}>
              <h2>{family}</h2>
              <div className="kiosk-grid">
                {familyBatches.map((batch: any) => {
                  const status = BATCH_STATUS[batch.status] ?? BATCH_STATUS.planned;
                  const next = nextBatchAction(batch);
                  const target = batch.adjusted_quantity ?? batch.planned_quantity;
                  const pct = target ? Math.min(100, Math.round((batch.packed_quantity / target) * 100)) : 0;
                  const batchAllocations = allocationsByBatch.get(batch.id) ?? [];
                  return (
                    <article className="kiosk-card" key={batch.id}>
                      <div className="kiosk-card__header">
                        <div>
                          <p className="kiosk-card__name">{batch.product_variants?.products?.name}</p>
                          <p className="kiosk-card__variant">{batch.product_variants?.name}</p>
                        </div>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>

                      <p className="kiosk-card__qty">{target}<span> uds.</span></p>
                      <div className="kiosk-card__progress"><div style={{ width: `${pct}%` }} /></div>

                      {batchAllocations.length ? (
                        <ul className="kiosk-card__points">
                          {batchAllocations.map((allocation: any) => (
                            <li key={allocation.id}>{allocation.pickup_points?.name}: {allocation.planned_quantity} uds.</li>
                          ))}
                        </ul>
                      ) : null}

                      {next ? (
                        <form action={updateBatch}>
                          <input type="hidden" name="id" value={batch.id} />
                          <input type="hidden" name="updatedAt" value={batch.updated_at} />
                          <input type="hidden" name="produced" value={next.produced} />
                          <input type="hidden" name="packed" value={next.packed} />
                          <input type="hidden" name="status" value={next.status} />
                          <input type="hidden" name="notes" value={batch.notes ?? ""} />
                          <button type="submit" className="kiosk-card__action">{next.label}</button>
                        </form>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        ) : (
          <p className="kiosk-empty">No hay lotes generados para {date === today ? "hoy" : "esta fecha"} todavía.</p>
        )}
      </main>
    </div>
  );
}
