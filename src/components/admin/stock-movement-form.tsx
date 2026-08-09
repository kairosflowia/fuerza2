"use client";
import { useActionState } from "react";

import { registerStockMovementAction, toggleStockTrackingAction, type StockActionState } from "@/app/admin/inventario/actions";
import { Alert, Button, Input, Select } from "@/components/ui";

const initial: StockActionState = { ok: false };

export function StockTrackingToggle({ variantId, enabled }: { variantId: string; enabled: boolean }) {
  return (
    <form action={toggleStockTrackingAction}>
      <input type="hidden" name="variant_id" value={variantId} />
      <input type="hidden" name="enabled" value={(!enabled).toString()} />
      <Button type="submit" variant="secondary">{enabled ? "Desactivar seguimiento" : "Activar seguimiento"}</Button>
    </form>
  );
}

export function StockMovementForm({ variantId }: { variantId: string }) {
  const [state, action, pending] = useActionState(registerStockMovementAction, initial);

  return (
    <form action={action} className="production-batch-edit">
      <input type="hidden" name="variant_id" value={variantId} />
      <Select id={`stock-type-${variantId}`} name="type" label="Tipo" defaultValue="entrada">
        <option value="entrada">Entrada</option>
        <option value="merma">Merma</option>
        <option value="ajuste">Ajuste (positivo o negativo)</option>
      </Select>
      <Input id={`stock-quantity-${variantId}`} name="quantity" label="Cantidad" type="number" helpText="En ajuste, usa un número negativo para restar." error={state.errors?.quantity} />
      <Input id={`stock-notes-${variantId}`} name="notes" label="Notas" optional />
      <Button type="submit" loading={pending} variant="secondary">Registrar movimiento</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardado" : "No se ha guardado"}>{state.message}</Alert> : null}
    </form>
  );
}
