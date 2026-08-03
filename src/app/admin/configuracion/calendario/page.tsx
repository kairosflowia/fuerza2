import Link from "next/link";

import { DeleteClosureButton, DeleteExceptionQuickButton, GlobalClosureForm, PointExceptionQuickForm } from "@/components/admin/calendar-forms";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Card, Select } from "@/components/ui";
import { PICKUP_EXCEPTION_TYPE_LABELS_ES, WEEKDAY_LABELS_ES, isoWeekday } from "@/lib/pickup-points";
import { createClient } from "@/lib/supabase/server";

function parseMonth(value: string | undefined) {
  if (value && /^\d{4}-\d{2}$/.test(value)) return value;
  return new Date().toISOString().slice(0, 7);
}

function monthLabel(month: string) {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString("es-ES", { month: "long", year: "numeric", timeZone: "UTC" });
}

function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

export default async function OperationalCalendarPage({ searchParams }: { searchParams: Promise<{ month?: string; punto?: string }> }) {
  const params = await searchParams;
  const month = parseMonth(params.month);
  const selectedPointId = params.punto ?? "";
  const [year, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const firstWeekday = isoWeekday(`${month}-01`);

  const db = await createClient();
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${String(daysInMonth).padStart(2, "0")}`;
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: points }, { data: closures }, { data: exceptions }] = await Promise.all([
    db.from("pickup_points").select("id, name").order("display_order"),
    db.from("global_closures").select("*").lte("starts_on", monthEnd).gte("ends_on", monthStart).order("starts_on"),
    db.from("pickup_point_exceptions").select("id, pickup_point_id, exception_date, type, public_message").gte("exception_date", monthStart).lte("exception_date", monthEnd).order("exception_date"),
  ]);

  const { data: upcomingClosures } = await db.from("global_closures").select("*").gte("ends_on", today).order("starts_on");
  const { data: upcomingExceptions } = await db.from("pickup_point_exceptions").select("id, pickup_point_id, exception_date, type, public_message").gte("exception_date", today).order("exception_date");

  const pointName = (id: string) => (points ?? []).find((p) => p.id === id)?.name ?? "Punto";
  const filteredExceptions = (exceptions ?? []).filter((e) => !selectedPointId || e.pickup_point_id === selectedPointId);

  const cells: { day: number | null; date: string | null }[] = [];
  for (let i = 1; i < firstWeekday; i++) cells.push({ day: null, date: null });
  for (let day = 1; day <= daysInMonth; day++) cells.push({ day, date: `${month}-${String(day).padStart(2, "0")}` });

  return (
    <>
      <AdminPageHeader title="Calendario operativo" description="Cierres globales y excepciones por punto. Todavía no hay pedidos que resolver: solo configuración." />

      <div className="admin-actions">
        <Link className="button button--secondary" href={`/admin/configuracion/calendario?month=${shiftMonth(month, -1)}${selectedPointId ? `&punto=${selectedPointId}` : ""}`}>← Mes anterior</Link>
        <strong style={{ textTransform: "capitalize" }}>{monthLabel(month)}</strong>
        <Link className="button button--secondary" href={`/admin/configuracion/calendario?month=${shiftMonth(month, 1)}${selectedPointId ? `&punto=${selectedPointId}` : ""}`}>Mes siguiente →</Link>
      </div>

      <form className="admin-form" style={{ maxWidth: "24rem" }}>
        <input type="hidden" name="month" value={month} />
        <Select id="calendar-point-filter" name="punto" label="Filtrar por punto" defaultValue={selectedPointId}>
          <option value="">Todos los puntos</option>
          {(points ?? []).map((point) => <option key={point.id} value={point.id}>{point.name}</option>)}
        </Select>
      </form>

      <Card>
        <table className="admin-table admin-calendar">
          <thead><tr>{WEEKDAY_LABELS_ES.map((label) => <th key={label}>{label.slice(0, 2)}</th>)}</tr></thead>
          <tbody>
            {Array.from({ length: Math.ceil(cells.length / 7) }, (_, week) => (
              <tr key={week}>
                {cells.slice(week * 7, week * 7 + 7).map((cell, i) => {
                  if (!cell.date) return <td key={i} />;
                  const isClosed = (closures ?? []).some((c) => cell.date! >= c.starts_on && cell.date! <= c.ends_on);
                  const dayExceptions = filteredExceptions.filter((e) => e.exception_date === cell.date);
                  return (
                    <td key={i} className={isClosed ? "admin-calendar__day admin-calendar__day--closed" : "admin-calendar__day"}>
                      <strong>{cell.day}</strong>
                      {isClosed ? <Badge variant="error">Cierre</Badge> : null}
                      {dayExceptions.map((exception) => (
                        <Badge key={exception.id} variant="warning">{pointName(exception.pickup_point_id)}: {PICKUP_EXCEPTION_TYPE_LABELS_ES[exception.type]}</Badge>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card>
        <h2>Crear cierre global</h2>
        <p className="field__help">Afecta al obrador y a todos los puntos. Vence sobre cualquier configuración o excepción de un punto concreto.</p>
        <GlobalClosureForm />
        <h3>Próximos cierres</h3>
        {(upcomingClosures ?? []).length ? (
          <ul className="admin-exception-list">
            {(upcomingClosures ?? []).map((closure) => (
              <li key={closure.id}>
                <span>{closure.starts_on} → {closure.ends_on}{closure.public_message ? ` · ${closure.public_message}` : ""}</span>
                <DeleteClosureButton id={closure.id} />
              </li>
            ))}
          </ul>
        ) : <p className="field__help">No hay cierres globales próximos.</p>}
      </Card>

      <Card>
        <h2>Crear excepción de un punto</h2>
        <p className="field__help">Prevalece sobre la configuración semanal de ese punto para la fecha indicada.</p>
        <PointExceptionQuickForm points={points ?? []} />
        <h3>Próximas excepciones</h3>
        {(upcomingExceptions ?? []).length ? (
          <ul className="admin-exception-list">
            {(upcomingExceptions ?? []).map((exception) => (
              <li key={exception.id}>
                <span>{exception.exception_date} · {pointName(exception.pickup_point_id)} · {PICKUP_EXCEPTION_TYPE_LABELS_ES[exception.type]}</span>
                <DeleteExceptionQuickButton id={exception.id} pointId={exception.pickup_point_id} />
              </li>
            ))}
          </ul>
        ) : <p className="field__help">No hay excepciones próximas.</p>}
      </Card>
    </>
  );
}
