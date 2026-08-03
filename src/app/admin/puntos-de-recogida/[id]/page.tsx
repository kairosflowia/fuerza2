import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteExceptionAction } from "../actions";
import { AcceptedProductsForm, CapacityDefaultsForm, CollectionWindowsForm, ExceptionsPanel, OpeningHoursForm } from "@/components/admin/pickup-point-forms";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, Card } from "@/components/ui";
import { PICKUP_POINT_STATUS_LABELS_ES } from "@/lib/pickup-points";
import { createClient } from "@/lib/supabase/server";

export default async function PickupPointAdminDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: point }, { data: hours }, { data: windows }, { data: capacity }, { data: exceptions }, { data: products }, { data: accepted }] = await Promise.all([
    db.from("pickup_points").select("*").eq("id", id).maybeSingle(),
    db.from("pickup_point_opening_hours").select("*").eq("pickup_point_id", id),
    db.from("pickup_point_collection_windows").select("*").eq("pickup_point_id", id).order("weekday"),
    db.from("pickup_point_capacity_defaults").select("*").eq("pickup_point_id", id),
    db.from("pickup_point_exceptions").select("*").eq("pickup_point_id", id).gte("exception_date", today).order("exception_date"),
    db.from("products").select("id, name").order("display_order"),
    db.from("product_pickup_points").select("product_id").eq("pickup_point_id", id).eq("is_available", true),
  ]);

  if (!point) notFound();

  return (
    <>
      <AdminPageHeader title={point.name} description={point.type === "bakery" ? "Obrador" : "Punto externo"} />
      <div className="admin-actions">
        <Badge>{PICKUP_POINT_STATUS_LABELS_ES[point.status]}</Badge>
        {point.is_main_bakery ? <Badge variant="primary">Obrador principal</Badge> : null}
        {point.is_public ? <Badge variant="information">Público</Badge> : null}
        <Link className="button button--primary" href={`/admin/puntos-de-recogida/${id}/editar`}>Editar datos</Link>
      </div>

      <Card>
        <h2>Horario general de apertura</h2>
        <OpeningHoursForm pointId={id} hours={hours ?? []} />
      </Card>

      <Card>
        <h2>Ventanas de recogida FUERZA</h2>
        <CollectionWindowsForm pointId={id} windows={windows ?? []} />
      </Card>

      <Card>
        <h2>Capacidad habitual</h2>
        <CapacityDefaultsForm pointId={id} capacity={capacity ?? []} />
      </Card>

      <Card>
        <h2>Excepciones</h2>
        <ExceptionsPanel pointId={id} exceptions={exceptions ?? []} onDelete={deleteExceptionAction} />
      </Card>

      <Card>
        <h2>Productos aceptados</h2>
        <AcceptedProductsForm
          pointId={id}
          acceptsAll={point.accepts_all_products}
          products={products ?? []}
          acceptedIds={(accepted ?? []).map((row) => row.product_id)}
        />
      </Card>

      <Link className="button button--text" href="/admin/puntos-de-recogida">Volver al listado</Link>
    </>
  );
}
