"use client";
import { useActionState } from "react";
import {
  createAvailabilityOverrideAction,
  deleteAvailabilityOverrideAction,
  type AvailabilityActionState,
} from "@/app/admin/disponibilidad/actions";
import { Alert, Button, Input, Select } from "@/components/ui";

const initial: AvailabilityActionState = { ok: false };

type Variant = { id: string; name: string; productName: string };
type PickupPoint = { id: string; name: string };
type Override = { id: string; productVariantId: string; pickupPointId: string | null; availabilityDate: string; capacityOverride: number; reason: string | null; pointName: string };

export function OverrideForm({ variants, points }: { variants: Variant[]; points: PickupPoint[] }) {
  const [state, action, pending] = useActionState(createAvailabilityOverrideAction, initial);
  return (
    <form action={action} className="admin-form">
      <Select id="ov-variant" name="product_variant_id" label="Variante" required error={state.errors?.availability_date}>
        <option value="">Selecciona</option>
        {variants.map((v) => <option key={v.id} value={v.id}>{v.productName} · {v.name}</option>)}
      </Select>
      <Select id="ov-point" name="pickup_point_id" label="Punto" optional helpText="Déjalo en blanco para limitar la variante en cualquier punto ese día.">
        <option value="">Todos los puntos</option>
        {points.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </Select>
      <Input id="ov-date" name="availability_date" label="Fecha" type="date" required />
      <Input id="ov-capacity" name="capacity_override" label="Capacidad para esta combinación" type="number" min="0" required error={state.errors?.capacity_override} />
      <Input id="ov-reason" name="reason" label="Motivo" optional />
      <Button type="submit" loading={pending}>Crear ajuste</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardado" : "No se ha guardado"}>{state.message}</Alert> : null}
    </form>
  );
}

export function OverrideList({ overrides }: { overrides: Override[] }) {
  if (!overrides.length) return <p className="field__help">No hay ajustes de capacidad puntuales.</p>;
  return (
    <ul className="admin-exception-list">
      {overrides.map((o) => (
        <li key={o.id}>
          <span>{o.availabilityDate} · {o.pointName} · {o.capacityOverride} u.{o.reason ? ` · ${o.reason}` : ""}</span>
          <form action={deleteAvailabilityOverrideAction}>
            <input type="hidden" name="id" value={o.id} />
            <Button type="submit" variant="destructive">Eliminar</Button>
          </form>
        </li>
      ))}
    </ul>
  );
}
