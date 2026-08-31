"use client";

import { useActionState, useState } from "react";

import {
  createProductionDateAction,
  setProductionDateStatusAction,
  updateProductionCapacityAction,
  type AvailabilityActionState,
} from "@/app/admin/disponibilidad/actions";
import { Alert, Badge, Button, Input, Modal } from "@/components/ui";
import { formatDateEs } from "@/lib/order-cutoff";

const initial: AvailabilityActionState = { ok: false };

export type DayInfo = {
  date: string;
  day: number;
  dot: "open" | "low" | "sold-out" | "closed" | "unset" | null;
  reason: string;
  production?: {
    id: string;
    status: string;
    totalCapacity: number;
    reservedForSubscriptions: number;
    confirmed: number;
    held: number;
    allocations: number;
    remaining: number;
  };
};

const STATUS_LABELS_ES: Record<string, string> = { draft: "Borrador", open: "Abierta", closed: "Cerrada", cancelled: "Cancelada" };
const DOT_LEGEND: { dot: NonNullable<DayInfo["dot"]>; label: string }[] = [
  { dot: "open", label: "Con capacidad" },
  { dot: "low", label: "Quedan pocas" },
  { dot: "sold-out", label: "Agotado" },
  { dot: "closed", label: "Cerrado" },
  { dot: "unset", label: "Sin configurar" },
];

/**
 * Grid del calendario + diálogo de detalle del día (Fase 12 del Plano
 * Mestre): cada celda muestra como mucho un punto de color -- el resto de
 * datos (capacidad, reservadas, confirmado, retenido, disponibles) y la
 * acción de editar viven en el diálogo que abre el clic, no repetidos en
 * cada casilla del mes.
 */
export function ProductionCalendar({ weeks, weekdayLabels, variantId, canManage }: {
  weeks: (DayInfo | null)[][]; weekdayLabels: readonly string[]; variantId: string; canManage: boolean;
}) {
  const [selected, setSelected] = useState<DayInfo | null>(null);

  return (
    <>
      <div className="admin-calendar">
        {weekdayLabels.map((label) => <div key={label} className="admin-calendar__weekday">{label.slice(0, 2)}</div>)}
        {weeks.flatMap((week, weekIndex) =>
          week.map((cell, dayIndex) => (
            <div className="admin-calendar__cell" key={`${weekIndex}-${dayIndex}`}>
              {cell ? (
                <button type="button" className="admin-calendar__day-btn" onClick={() => setSelected(cell)}>
                  <span className="admin-calendar__day-num">{cell.day}</span>
                  {cell.dot ? <span className={`admin-calendar__dot admin-calendar__dot--${cell.dot}`} aria-hidden="true" /> : null}
                </button>
              ) : null}
            </div>
          )),
        )}
      </div>

      <div className="admin-calendar-legend">
        {DOT_LEGEND.map((item) => (
          <span className="admin-calendar-legend__item" key={item.dot}>
            <span className={`admin-calendar__dot admin-calendar__dot--${item.dot}`} aria-hidden="true" />
            {item.label}
          </span>
        ))}
        <span className="admin-calendar-legend__item">Sin punto: no se produce ese día</span>
      </div>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? formatDateEs(selected.date) : ""}>
        {selected ? <DayDetail day={selected} variantId={variantId} canManage={canManage} /> : null}
      </Modal>
    </>
  );
}

function DayDetail({ day, variantId, canManage }: { day: DayInfo; variantId: string; canManage: boolean }) {
  if (!day.production) {
    return (
      <div className="form-tab-panel">
        <p>{day.reason}</p>
        {canManage && day.dot === "unset" ? <QuickCreateForm variantId={variantId} date={day.date} /> : null}
      </div>
    );
  }
  const p = day.production;
  return (
    <div className="form-tab-panel">
      <Badge variant={p.status === "cancelled" ? "error" : p.status === "closed" ? "warning" : "neutral"}>{STATUS_LABELS_ES[p.status] ?? p.status}</Badge>
      <dl className="wizard-summary">
        <div className="wizard-summary__row"><span className="wizard-summary__label">Capacidad total</span><span>{p.totalCapacity}</span></div>
        <div className="wizard-summary__row"><span className="wizard-summary__label">Reservado (Plan de Pan)</span><span>{p.reservedForSubscriptions}{p.allocations ? ` (+${p.allocations} asignado)` : ""}</span></div>
        <div className="wizard-summary__row"><span className="wizard-summary__label">Confirmado</span><span>{p.confirmed}</span></div>
        <div className="wizard-summary__row"><span className="wizard-summary__label">Retenido</span><span>{p.held}</span></div>
        <div className="wizard-summary__row"><span className="wizard-summary__label">Disponible</span><strong>{p.remaining}</strong></div>
      </dl>
      {canManage ? <QuickCapacityForm row={p} /> : null}
      {canManage ? <QuickStatusActions id={p.id} status={p.status} /> : null}
    </div>
  );
}

function QuickCreateForm({ variantId, date }: { variantId: string; date: string }) {
  const [state, action, pending] = useActionState(createProductionDateAction, initial);
  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="product_variant_id" value={variantId} />
      <input type="hidden" name="production_date" value={date} />
      <Input id="quick-pd-capacity" name="total_capacity" label="Capacidad total" type="number" min="0" required error={state.errors?.total_capacity} />
      <Input id="quick-pd-reserved" name="reserved_for_subscriptions" label="Reservado para el Plan de Pan" type="number" min="0" defaultValue={0} optional error={state.errors?.reserved_for_subscriptions} />
      <Button type="submit" loading={pending}>Crear fecha de producción</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Creada" : "No se ha creado"}>{state.message}</Alert> : null}
    </form>
  );
}

function QuickCapacityForm({ row }: { row: NonNullable<DayInfo["production"]> }) {
  const [state, action, pending] = useActionState(updateProductionCapacityAction, initial);
  const committed = row.confirmed + row.held + row.reservedForSubscriptions + row.allocations;
  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="id" value={row.id} />
      <p className="field__help">Comprometido ahora mismo: {committed} unidades. No se puede bajar la capacidad total por debajo de eso.</p>
      <Input id={`qcap-total-${row.id}`} name="total_capacity" label="Capacidad total" type="number" min="0" defaultValue={row.totalCapacity} error={state.errors?.total_capacity} />
      <Input id={`qcap-reserved-${row.id}`} name="reserved_for_subscriptions" label="Reservado para el Plan de Pan" type="number" min="0" defaultValue={row.reservedForSubscriptions} error={state.errors?.reserved_for_subscriptions} />
      <Button type="submit" loading={pending}>Guardar capacidad</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardado" : "No se ha guardado"}>{state.message}</Alert> : null}
    </form>
  );
}

function QuickStatusActions({ id, status }: { id: string; status: string }) {
  const [state, action, pending] = useActionState(setProductionDateStatusAction, initial);
  return (
    <div className="admin-action-group">
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
      {status !== "cancelled" ? (
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
