"use client";

import { useRef, useState } from "react";

import { toggleStockTrackingAction } from "@/app/admin/inventario/actions";
import { updateLowStockThresholdAction } from "@/app/admin/productos/actions";
import { Button, Input, Modal } from "@/components/ui";
import { ActionMenu } from "@/components/ui/menu";
import { VariantMovementsDrawer } from "@/components/admin/variant-movements-drawer";

/**
 * Menú "•••" de una fila de inventario: solo "Actualizar" (StockMovementButton)
 * queda visible fuera de aquí como acción primaria (Fase 11 del Plano
 * Mestre). El drawer de movimientos y el modal de mínimo viven hermanos del
 * ActionMenu, no dentro de sus children, por la misma razón documentada en
 * variant-movements-drawer.tsx.
 */
export function InventoryRowActions({ variantId, variantName, productId, enabled, threshold }: {
  variantId: string; variantName: string; productId?: string; enabled: boolean; threshold: number | null;
}) {
  const [movementsOpen, setMovementsOpen] = useState(false);
  const [thresholdOpen, setThresholdOpen] = useState(false);
  const movementsTriggerRef = useRef<HTMLButtonElement>(null);
  const thresholdTriggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <ActionMenu label={`Más acciones para ${variantName}`}>
        <button ref={movementsTriggerRef} type="button" className="menu__item" onClick={() => setMovementsOpen(true)}>Ver movimientos</button>
        <button ref={thresholdTriggerRef} type="button" className="menu__item" onClick={() => setThresholdOpen(true)}>Configurar stock mínimo</button>
        <form action={toggleStockTrackingAction}>
          <input type="hidden" name="variant_id" value={variantId} />
          <input type="hidden" name="enabled" value={(!enabled).toString()} />
          {productId ? <input type="hidden" name="product_id" value={productId} /> : null}
          <button type="submit" className="menu__item" data-destructive={enabled || undefined}>{enabled ? "Desactivar seguimiento" : "Activar seguimiento"}</button>
        </form>
      </ActionMenu>

      <VariantMovementsDrawer variantId={variantId} variantName={variantName} open={movementsOpen} onOpenChange={setMovementsOpen} returnFocusRef={movementsTriggerRef} />

      <Modal open={thresholdOpen} onClose={() => setThresholdOpen(false)} title={`Stock mínimo · ${variantName}`} returnFocusRef={thresholdTriggerRef}>
        <form action={updateLowStockThresholdAction} className="admin-form">
          <input type="hidden" name="variant_id" value={variantId} />
          {productId ? <input type="hidden" name="product_id" value={productId} /> : null}
          <Input
            id={`threshold-${variantId}`} name="low_stock_threshold" label="Stock mínimo" type="number" min={0}
            defaultValue={threshold ?? ""} placeholder="Global" helpText="Déjalo vacío para usar el umbral global."
          />
          <Button type="submit">Guardar</Button>
        </form>
      </Modal>
    </>
  );
}
