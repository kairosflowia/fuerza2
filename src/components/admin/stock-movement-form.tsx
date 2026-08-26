"use client";
import { useActionState, useEffect, useRef, useState } from "react";

import { registerStockMovementAction, toggleStockTrackingAction, type StockActionState } from "@/app/admin/inventario/actions";
import { updateLowStockThresholdAction } from "@/app/admin/productos/actions";
import { Alert, Button, Input, Modal, Select } from "@/components/ui";

const initial: StockActionState = { ok: false };

export function StockTrackingToggle({ variantId, enabled, productId }: { variantId: string; enabled: boolean; productId?: string }) {
  return (
    <form action={toggleStockTrackingAction}>
      <input type="hidden" name="variant_id" value={variantId} />
      <input type="hidden" name="enabled" value={(!enabled).toString()} />
      {productId ? <input type="hidden" name="product_id" value={productId} /> : null}
      <Button type="submit" variant="secondary">{enabled ? "Desactivar seguimiento" : "Activar seguimiento"}</Button>
    </form>
  );
}

export function LowStockThresholdForm({ variantId, productId, value }: { variantId: string; productId: string; value: number | null }) {
  return (
    <form action={updateLowStockThresholdAction} className="inventory-threshold-form">
      <input type="hidden" name="variant_id" value={variantId} />
      <input type="hidden" name="product_id" value={productId} />
      <label className="inventory-threshold-form__label" htmlFor={`threshold-${variantId}`}>Stock mínimo</label>
      <input id={`threshold-${variantId}`} className="inventory-threshold-form__input" type="number" name="low_stock_threshold" min={0} defaultValue={value ?? ""} placeholder="Global" />
      <Button type="submit" variant="secondary">Guardar</Button>
    </form>
  );
}

export function StockMovementButton({ variantId, productName, variantName, productId }: { variantId: string; productName: string; variantName: string; productId?: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(registerStockMovementAction, initial);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!state.ok) return;
    const timer = setTimeout(() => setOpen(false), 900);
    return () => clearTimeout(timer);
  }, [state]);

  return (
    <>
      <Button ref={triggerRef} type="button" variant="secondary" onClick={() => setOpen(true)}>Actualizar stock</Button>
      <Modal open={open} onClose={() => setOpen(false)} title={`Movimiento de estoque · ${productName} — ${variantName}`} returnFocusRef={triggerRef}>
        <form action={action} className="admin-form">
          <input type="hidden" name="variant_id" value={variantId} />
          {productId ? <input type="hidden" name="product_id" value={productId} /> : null}
          <Select id={`stock-type-${variantId}`} name="type" label="Tipo" defaultValue="produccion">
            <option value="produccion">Producción</option>
            <option value="entrada">Entrada</option>
            <option value="merma">Merma</option>
            <option value="ajuste">Ajuste (positivo o negativo)</option>
          </Select>
          <Input id={`stock-quantity-${variantId}`} name="quantity" label="Cantidad" type="number" helpText="En ajuste, usa un número negativo para restar." error={state.errors?.quantity} />
          <Input id={`stock-notes-${variantId}`} name="notes" label="Notas" optional />
          <Button type="submit" loading={pending} fullWidth>Registrar movimiento</Button>
          {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardado" : "No se ha guardado"}>{state.message}</Alert> : null}
        </form>
      </Modal>
    </>
  );
}
