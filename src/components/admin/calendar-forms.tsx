"use client";
import { useActionState } from "react";
import { createExceptionAction, createGlobalClosureAction, deleteExceptionAction, deleteGlobalClosureAction, type PickupActionState } from "@/app/admin/puntos-de-recogida/actions";
import { Alert, Button, Input, Select } from "@/components/ui";

const initial: PickupActionState = { ok: false };

export function GlobalClosureForm() {
  const [state, action, pending] = useActionState(createGlobalClosureAction, initial);
  return (
    <form action={action} className="admin-form">
      <Input id="closure-start" name="starts_on" label="Desde" type="date" required error={state.errors?.starts_on} />
      <Input id="closure-end" name="ends_on" label="Hasta" optional helpText="Si se deja vacío, es un único día." error={state.errors?.ends_on} type="date" />
      <Input id="closure-public" name="public_message" label="Mensaje público" optional />
      <Input id="closure-internal" name="internal_reason" label="Motivo interno" optional />
      <Button type="submit" loading={pending}>Crear cierre global</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardado" : "No se ha guardado"}>{state.message}</Alert> : null}
    </form>
  );
}

export function DeleteClosureButton({ id }: { id: string }) {
  return (
    <form action={deleteGlobalClosureAction}>
      <input type="hidden" name="id" value={id} />
      <Button type="submit" variant="destructive">Cancelar cierre</Button>
    </form>
  );
}

export function PointExceptionQuickForm({ points }: { points: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createExceptionAction, initial);
  return (
    <form action={action} className="admin-form">
      <Select id="exception-point" name="pickup_point_id" label="Punto" required>
        {points.map((point) => <option key={point.id} value={point.id}>{point.name}</option>)}
      </Select>
      <Input id="exception-quick-date" name="exception_date" label="Fecha" type="date" required error={state.errors?.exception_date} />
      <Select id="exception-quick-type" name="type" label="Tipo" defaultValue="closed">
        <option value="closed">Cerrado</option>
        <option value="extraordinary_opening">Apertura extraordinaria</option>
        <option value="schedule_override">Horario distinto</option>
        <option value="capacity_override">Capacidad distinta</option>
      </Select>
      <Input id="exception-quick-start" name="collection_starts_at" label="Inicio de recogida" type="time" optional />
      <Input id="exception-quick-end" name="collection_ends_at" label="Fin de recogida" type="time" optional />
      <Input id="exception-quick-capacity" name="capacity_override" label="Capacidad para ese día" type="number" min="0" optional />
      <Input id="exception-quick-public" name="public_message" label="Mensaje público" optional />
      <Input id="exception-quick-internal" name="internal_reason" label="Motivo interno" optional />
      <Button type="submit" loading={pending}>Crear excepción</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardada" : "No se ha guardado"}>{state.message}</Alert> : null}
    </form>
  );
}

export function DeleteExceptionQuickButton({ id, pointId }: { id: string; pointId: string }) {
  return (
    <form action={deleteExceptionAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="pickup_point_id" value={pointId} />
      <Button type="submit" variant="destructive">Cancelar excepción</Button>
    </form>
  );
}
