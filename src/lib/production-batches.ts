export const BATCH_STATUS: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "error" }> = {
  planned: { label: "Pendiente", variant: "neutral" },
  in_progress: { label: "En horno", variant: "warning" },
  produced: { label: "Horneado", variant: "success" },
  packed: { label: "Embalado", variant: "success" },
  completed: { label: "Listo", variant: "success" },
  requires_attention: { label: "Atención", variant: "error" },
  cancelled: { label: "Cancelado", variant: "neutral" },
};
export const BATCH_STATUS_OPTIONS = ["planned", "in_progress", "produced", "packed", "completed", "requires_attention", "cancelled"];

export type BatchQuickAction = { status: string; label: string; produced: number; packed: number };

/**
 * Atajos de un toque para el ciclo "iniciado → preparado → concluido" del
 * Plano Mestre (Fase 9), sobre el mismo enum de 5 estados no terminales que
 * ya usa update_production_batch(): "preparado" avanza produced_quantity y
 * packed_quantity juntos hasta el objetivo (adjusted_quantity si existe, si
 * no planned_quantity), sin crear ningún estado ni cálculo nuevo. El
 * formulario de edición completo sigue disponible para casos parciales,
 * cancelación o marcar atención. "Marcar concluido" puede rechazarse en el
 * servidor si quedan artículos del pedido sin preparar -- esperado, no es un
 * fallo del atajo.
 */
export function nextBatchAction(batch: { status: string; planned_quantity: number; adjusted_quantity: number | null; produced_quantity: number; packed_quantity: number }): BatchQuickAction | null {
  const target = batch.adjusted_quantity ?? batch.planned_quantity;
  if (batch.status === "planned") return { status: "in_progress", label: "Marcar iniciado", produced: batch.produced_quantity, packed: batch.packed_quantity };
  if (batch.status === "in_progress") return { status: "packed", label: "Marcar preparado", produced: target, packed: target };
  if (batch.status === "produced") return { status: "packed", label: "Marcar preparado", produced: batch.produced_quantity, packed: target };
  if (batch.status === "packed") return { status: "completed", label: "Marcar concluido", produced: target, packed: target };
  return null;
}

/**
 * Misma consulta y mismos cálculos (total, embalado, %) que ya usaba
 * /admin/produccion antes de la Fase 9 — solo extraídos aquí para que el
 * "Modo producción" (fuera del layout admin) no duplique la lógica.
 */
export async function loadProductionDay(db: any, date: string) {
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

  const allocationsByBatch = new Map<string, any[]>();
  for (const allocation of allocations ?? []) {
    const list = allocationsByBatch.get(allocation.production_batch_id) ?? [];
    list.push(allocation);
    allocationsByBatch.set(allocation.production_batch_id, list);
  }

  return { batches: numberedBatches, orders: orders ?? [], incidents: incidents ?? [], allocations: allocations ?? [], allocationsByBatch, total, packed, packedPct, groups };
}
