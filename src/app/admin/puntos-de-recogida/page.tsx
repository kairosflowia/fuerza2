import Link from "next/link";

import { quickSetStatusAction } from "./actions";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Button, EmptyState } from "@/components/ui";
import { PICKUP_POINT_STATUS_LABELS_ES, WEEKDAY_LABELS_ES } from "@/lib/pickup-points";
import { createClient } from "@/lib/supabase/server";

export default async function PickupPointsAdminPage() {
  const db = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: points }, { data: windows }, { data: exceptions }, { data: capacity }] = await Promise.all([
    db.from("pickup_points").select("*").order("display_order"),
    db.from("pickup_point_collection_windows").select("pickup_point_id, weekday, is_active").eq("is_active", true),
    db.from("pickup_point_exceptions").select("pickup_point_id, exception_date, type").gte("exception_date", today).order("exception_date"),
    db.from("pickup_point_capacity_defaults").select("pickup_point_id, weekday, max_units"),
  ]);

  return (
    <>
      <AdminPageHeader title="Puntos de recogida" description="Obrador principal, puntos externos, horarios, ventanas y capacidad." />
      <div className="admin-actions">
        <Link className="button button--primary" href="/admin/puntos-de-recogida/nuevo">Nuevo punto</Link>
        <Link className="button button--secondary" href="/admin/configuracion/calendario">Calendario operativo</Link>
      </div>

      {points?.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Punto</th>
                <th>Tipo</th>
                <th>Ciudad</th>
                <th>Estado</th>
                <th>Días de recogida</th>
                <th>Capacidad habitual</th>
                <th>Próxima excepción</th>
                <th>Público</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => {
                const days = (windows ?? []).filter((w) => w.pickup_point_id === point.id).map((w) => w.weekday);
                const uniqueDays = Array.from(new Set(days)).sort((a, b) => a - b);
                const nextException = (exceptions ?? []).find((e) => e.pickup_point_id === point.id);
                const capacities = (capacity ?? []).filter((c) => c.pickup_point_id === point.id).map((c) => c.max_units);

                return (
                  <tr key={point.id}>
                    <td>
                      <Link href={`/admin/puntos-de-recogida/${point.id}`}>{point.name}</Link>
                      {point.is_main_bakery ? <Badge variant="primary">Principal</Badge> : null}
                    </td>
                    <td>{point.type === "bakery" ? "Obrador" : "Externo"}</td>
                    <td>{point.city ?? "—"}</td>
                    <td><Badge>{PICKUP_POINT_STATUS_LABELS_ES[point.status]}</Badge></td>
                    <td>{uniqueDays.length ? uniqueDays.map((d) => WEEKDAY_LABELS_ES[d - 1].slice(0, 2)).join(", ") : "Sin configurar"}</td>
                    <td>{capacities.length ? `${Math.min(...capacities)}–${Math.max(...capacities)} u.` : "Sin configurar"}</td>
                    <td>{nextException ? nextException.exception_date : "Ninguna"}</td>
                    <td>{point.is_public ? "Sí" : "No"}</td>
                    <td className="admin-table__actions">
                      <Link href={`/admin/puntos-de-recogida/${point.id}/editar`}>Editar</Link>
                      {point.status !== "active" ? (
                        <form action={quickSetStatusAction}>
                          <input type="hidden" name="id" value={point.id} />
                          <input type="hidden" name="status" value="active" />
                          <Button type="submit" variant="text">Activar</Button>
                        </form>
                      ) : (
                        <form action={quickSetStatusAction}>
                          <input type="hidden" name="id" value={point.id} />
                          <input type="hidden" name="status" value="temporarily_unavailable" />
                          <Button type="submit" variant="text">No disponible</Button>
                        </form>
                      )}
                      {point.status !== "inactive" ? (
                        <form action={quickSetStatusAction}>
                          <input type="hidden" name="id" value={point.id} />
                          <input type="hidden" name="status" value="inactive" />
                          <Button type="submit" variant="destructive">Inactivar</Button>
                        </form>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Todavía no hay puntos de recogida" description="Crea el obrador principal para empezar." />
      )}
    </>
  );
}
