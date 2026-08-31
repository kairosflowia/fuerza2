"use client";

import { useActionState, useState } from "react";

import { createExceptionAction, deleteExceptionAction, deleteGlobalClosureAction, type PickupActionState } from "@/app/admin/puntos-de-recogida/actions";
import { Alert, Button, Input, Modal, Select } from "@/components/ui";
import { formatDateEs } from "@/lib/order-cutoff";
import { PICKUP_EXCEPTION_TYPE_LABELS_ES } from "@/lib/pickup-points-domain";

const initial: PickupActionState = { ok: false };

export type RecogidaDayInfo = {
  date: string;
  day: number;
  dot: "closed" | "exception" | null;
  closure?: { id: string; startsOn: string; endsOn: string; publicMessage: string | null };
  exceptions: { id: string; pointId: string; pointName: string; type: string; publicMessage: string | null }[];
};

/**
 * Mismo lenguaje visual que ProductionCalendar (Fase 12): un punto por
 * celda como mucho, detalle completo (y acción de crear/eliminar) en el
 * diálogo que abre el clic del día.
 */
export function RecogidasCalendar({ weeks, weekdayLabels, points, canManage }: {
  weeks: (RecogidaDayInfo | null)[][]; weekdayLabels: readonly string[]; points: { id: string; name: string }[]; canManage: boolean;
}) {
  const [selected, setSelected] = useState<RecogidaDayInfo | null>(null);

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
                  {cell.dot ? <span className={`admin-calendar__dot admin-calendar__dot--${cell.dot === "closed" ? "closed" : "low"}`} aria-hidden="true" /> : null}
                </button>
              ) : null}
            </div>
          )),
        )}
      </div>

      <div className="admin-calendar-legend">
        <span className="admin-calendar-legend__item"><span className="admin-calendar__dot admin-calendar__dot--closed" aria-hidden="true" />Cierre global</span>
        <span className="admin-calendar-legend__item"><span className="admin-calendar__dot admin-calendar__dot--low" aria-hidden="true" />Excepción de un punto</span>
        <span className="admin-calendar-legend__item">Sin punto: sin cierres ni excepciones</span>
      </div>

      <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected ? formatDateEs(selected.date) : ""}>
        {selected ? <RecogidaDayDetail day={selected} points={points} canManage={canManage} /> : null}
      </Modal>
    </>
  );
}

function RecogidaDayDetail({ day, points, canManage }: { day: RecogidaDayInfo; points: { id: string; name: string }[]; canManage: boolean }) {
  return (
    <div className="form-tab-panel">
      {day.closure ? (
        <div className="inventory-row">
          <div className="inventory-row__main">
            <p className="inventory-row__product">Cierre global</p>
            <p className="inventory-row__variant">{day.closure.startsOn} → {day.closure.endsOn}{day.closure.publicMessage ? ` · ${day.closure.publicMessage}` : ""}</p>
          </div>
          {canManage ? (
            <form action={deleteGlobalClosureAction}>
              <input type="hidden" name="id" value={day.closure.id} />
              <Button type="submit" variant="destructive">Cancelar cierre</Button>
            </form>
          ) : null}
        </div>
      ) : null}

      {day.exceptions.map((exception) => (
        <div className="inventory-row" key={exception.id}>
          <div className="inventory-row__main">
            <p className="inventory-row__product">{exception.pointName}</p>
            <p className="inventory-row__variant">{PICKUP_EXCEPTION_TYPE_LABELS_ES[exception.type as keyof typeof PICKUP_EXCEPTION_TYPE_LABELS_ES] ?? exception.type}{exception.publicMessage ? ` · ${exception.publicMessage}` : ""}</p>
          </div>
          {canManage ? (
            <form action={deleteExceptionAction}>
              <input type="hidden" name="id" value={exception.id} />
              <input type="hidden" name="pickup_point_id" value={exception.pointId} />
              <Button type="submit" variant="destructive">Cancelar excepción</Button>
            </form>
          ) : null}
        </div>
      ))}

      {!day.closure && !day.exceptions.length ? <p>Sin cierres ni excepciones registrados este día.</p> : null}

      {canManage ? <QuickExceptionForm date={day.date} points={points} /> : null}
    </div>
  );
}

function QuickExceptionForm({ date, points }: { date: string; points: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createExceptionAction, initial);
  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="exception_date" value={date} />
      <Select id="quick-exception-point" name="pickup_point_id" label="Punto" required>
        {points.map((point) => <option key={point.id} value={point.id}>{point.name}</option>)}
      </Select>
      <Select id="quick-exception-type" name="type" label="Tipo" defaultValue="closed">
        <option value="closed">Cerrado</option>
        <option value="extraordinary_opening">Apertura extraordinaria</option>
        <option value="schedule_override">Horario distinto</option>
        <option value="capacity_override">Capacidad distinta</option>
      </Select>
      <Input id="quick-exception-start" name="collection_starts_at" label="Inicio de recogida" type="time" optional />
      <Input id="quick-exception-end" name="collection_ends_at" label="Fin de recogida" type="time" optional />
      <Input id="quick-exception-capacity" name="capacity_override" label="Capacidad para ese día" type="number" min="0" optional />
      <Input id="quick-exception-public" name="public_message" label="Mensaje público" optional />
      <Button type="submit" loading={pending}>Crear excepción para este día</Button>
      {state.message ? <Alert variant={state.ok ? "success" : "error"} title={state.ok ? "Guardada" : "No se ha guardado"}>{state.message}</Alert> : null}
    </form>
  );
}
