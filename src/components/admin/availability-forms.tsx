"use client";
import { useActionState } from "react";
import {
  createAvailabilityOverrideAction,
  createProductionDateAction,
  deleteAvailabilityOverrideAction,
  setProductionDateStatusAction,
  updateProductionCapacityAction,
  type AvailabilityActionState,
} from "@/app/admin/disponibilidad/actions";
import { Alert, Badge, Button, Input, Select } from "@/components/ui";

const initial: AvailabilityActionState = { ok: false };

type Variant = { id: string; name: string; productName: string };

export function CreateProductionDateForm({ variants }: { variants: Variant[] }) {
  const [state, action, pending] = useActionState(createProductionDateAction, initial);
  return (
    <form action={action} className="admin-form">
      <Select id="pd-variant" name="product_variant_id" label="Variante" required error={state.errors?.product_variant_id}>
        <option value="">Selecciona</option>
        {variants.map((v) => <option key={v.id} value={v.id}>{v.productName} · {v.name}</option>)}
      </Select>
      <Input id="pd-date" name="production_date" label="Fecha de producción" type="date" required error={state.errors?.production_date} />
      <Input id="pd-capacity" name="total_capacity" label="Capacidad total" type="number" min="0" required error={state.errors?.total_capacity} />
      <Input id="pd-reserved" name="reserved_for_subscriptions" label="Reservado para el Plan de Pan" type="number" min="0" defaultValue={0} optional error={state.errors?.reserved_for_subscriptions} />
      <Input id="pd-notes" name="notes" label="Notas" optional />
      <Button type="submit" loading={pending}>Crear fecha de producción</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Creada" : "No se ha creado"}>{state.message}</Alert> : null}
    </form>
  );
}

type ProductionDateRow = {
  id: string;
  totalCapacity: number;
  reservedForSubscriptions: number;
  status: string;
  confirmed: number;
  held: number;
  allocations: number;
};

export function CapacityForm({ row }: { row: ProductionDateRow }) {
  const [state, action, pending] = useActionState(updateProductionCapacityAction, initial);
  const committed = row.confirmed + row.held + row.reservedForSubscriptions + row.allocations;
  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="id" value={row.id} />
      <p className="field__help">Comprometido ahora mismo: {committed} unidades. No se puede bajar la capacidad total por debajo de eso.</p>
      <Input id={`cap-total-${row.id}`} name="total_capacity" label="Capacidad total" type="number" min="0" defaultValue={row.totalCapacity} error={state.errors?.total_capacity} />
      <Input id={`cap-reserved-${row.id}`} name="reserved_for_subscriptions" label="Reservado para el Plan de Pan" type="number" min="0" defaultValue={row.reservedForSubscriptions} error={state.errors?.reserved_for_subscriptions} />
      <Button type="submit" loading={pending}>Guardar capacidad</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardado" : "No se ha guardado"}>{state.message}</Alert> : null}
    </form>
  );
}

const STATUS_LABELS_ES: Record<string, string> = { draft: "Borrador", open: "Abierta", closed: "Cerrada", cancelled: "Cancelada" };

export function StatusActions({ id, status, canCancel }: { id: string; status: string; canCancel: boolean }) {
  const [state, action, pending] = useActionState(setProductionDateStatusAction, initial);
  return (
    <div className="admin-actions">
      <Badge>{STATUS_LABELS_ES[status] ?? status}</Badge>
      {status !== "open" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="open" />
          <Button type="submit" variant="secondary" loading={pending}>Abrir</Button>
        </form>
      ) : null}
      {status !== "closed" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="closed" />
          <Button type="submit" variant="secondary" loading={pending}>Cerrar</Button>
        </form>
      ) : null}
      {canCancel && status !== "cancelled" ? (
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="status" value="cancelled" />
          <Button type="submit" variant="destructive" loading={pending}>Cancelar</Button>
        </form>
      ) : null}
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Actualizado" : "No se ha podido actualizar"}>{state.message}</Alert> : null}
    </div>
  );
}

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
