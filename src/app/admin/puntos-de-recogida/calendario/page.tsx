import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { DeleteClosureButton, GlobalClosureForm } from "@/components/admin/calendar-forms";
import { RecogidasCalendar, type RecogidaDayInfo } from "@/components/admin/recogidas-calendar";
import { RecogidasTabs } from "@/components/admin/recogidas-tabs";
import { Card } from "@/components/ui";
import { canManagePickupOperations } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { PICKUP_EXCEPTION_TYPE_LABELS_ES, WEEKDAY_LABELS_ES, isoWeekday } from "@/lib/pickup-points-domain";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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
  return new Date(Date.UTC(year, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

export default async function RecogidasCalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const identity = await getCurrentIdentity();
  const canManage = identity ? canManagePickupOperations(identity.roles) : false;
  const params = await searchParams;
  const month = parseMonth(params.month);
  const [year, m] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const firstWeekday = isoWeekday(`${month}-01`);

  const db = await createClient();
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${String(daysInMonth).padStart(2, "0")}`;
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: points }, { data: closures }, { data: exceptions }] = await Promise.all([
    db.from("pickup_points").select("id, name").eq("status", "active").order("display_order"),
    db.from("global_closures").select("*").lte("starts_on", monthEnd).gte("ends_on", monthStart).order("starts_on"),
    db.from("pickup_point_exceptions").select("id, pickup_point_id, exception_date, type, public_message").gte("exception_date", monthStart).lte("exception_date", monthEnd).order("exception_date"),
  ]);

  const { data: upcomingClosures } = await db.from("global_closures").select("*").gte("ends_on", today).order("starts_on");
  const { data: upcomingExceptions } = await db.from("pickup_point_exceptions").select("id, pickup_point_id, exception_date, type, public_message").gte("exception_date", today).order("exception_date");

  const pointName = (id: string) => (points ?? []).find((p) => p.id === id)?.name ?? "Punto";

  const weeks: (RecogidaDayInfo | null)[][] = [];
  let week: (RecogidaDayInfo | null)[] = Array(firstWeekday - 1).fill(null);
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${month}-${String(day).padStart(2, "0")}`;
    const closure = (closures ?? []).find((c) => date >= c.starts_on && date <= c.ends_on);
    const dayExceptions = (exceptions ?? []).filter((e) => e.exception_date === date).map((e) => ({ id: e.id, pointId: e.pickup_point_id, pointName: pointName(e.pickup_point_id), type: e.type, publicMessage: e.public_message }));
    week.push({
      date, day,
      dot: closure ? "closed" : dayExceptions.length ? "exception" : null,
      closure: closure ? { id: closure.id, startsOn: closure.starts_on, endsOn: closure.ends_on, publicMessage: closure.public_message } : undefined,
      exceptions: dayExceptions,
    });
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }

  return (
    <>
      <AdminPageHeader title="Recogidas" description="Puntos de recogida, cierres globales y excepciones: un mismo sistema de capacidad y recogida." />
      <RecogidasTabs />

      <div className="admin-actions">
        <Link className="button button--secondary" href={`/admin/puntos-de-recogida/calendario?month=${shiftMonth(month, -1)}`}>← Mes anterior</Link>
        <strong style={{ textTransform: "capitalize" }}>{monthLabel(month)}</strong>
        <Link className="button button--secondary" href={`/admin/puntos-de-recogida/calendario?month=${shiftMonth(month, 1)}`}>Mes siguiente →</Link>
      </div>

      <RecogidasCalendar weeks={weeks} weekdayLabels={WEEKDAY_LABELS_ES} points={points ?? []} canManage={canManage} />

      {canManage ? (
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
      ) : null}

      <Card>
        <h2>Próximas excepciones por punto</h2>
        <p className="field__help">Para crear una nueva, haz clic en el día correspondiente del calendario.</p>
        {(upcomingExceptions ?? []).length ? (
          <ul className="admin-exception-list">
            {(upcomingExceptions ?? []).map((exception) => (
              <li key={exception.id}>
                <span>{exception.exception_date} · {pointName(exception.pickup_point_id)} · {PICKUP_EXCEPTION_TYPE_LABELS_ES[exception.type]}</span>
              </li>
            ))}
          </ul>
        ) : <p className="field__help">No hay excepciones próximas.</p>}
      </Card>
    </>
  );
}
