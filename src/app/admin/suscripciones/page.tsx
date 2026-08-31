import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, EmptyState } from "@/components/ui";
import { FREQUENCY_LABELS_ES, SUBSCRIPTION_STATUS_BADGE_VARIANT, subscriptionStatusLabel } from "@/lib/subscriptions-domain";
import { createClient } from "@/lib/supabase/server";

export default async function AdminSubscriptions() {
  const db: any = await createClient();
  const { data: list } = await db
    .from("subscriptions")
    .select("id,status,frequency,next_collection_date,requires_attention_reason,pickup_points(name),profiles(full_name)")
    .order("created_at", { ascending: false });

  return (
    <>
      <AdminPageHeader
        title="Fuerza Habitual"
        description="Suscripciones, ciclos y alertas operativas."
        actions={<Link href="/admin/suscripciones/planes">Panes en membresía</Link>}
      />
      {list?.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Cliente</th><th>Frecuencia</th><th>Estado</th><th>Próxima recogida</th></tr>
            </thead>
            <tbody>
              {list.map((s: any) => (
                <tr key={s.id}>
                  <td><Link href={`/admin/suscripciones/${s.id}`}>{s.profiles?.full_name ?? "Cliente"}</Link></td>
                  <td>{(FREQUENCY_LABELS_ES as Record<string, string>)[s.frequency] ?? s.frequency}</td>
                  <td>
                    <Badge variant={SUBSCRIPTION_STATUS_BADGE_VARIANT[s.status] ?? "neutral"}>{subscriptionStatusLabel(s.status)}</Badge>
                    {s.requires_attention_reason ? ` · ${s.requires_attention_reason}` : ""}
                  </td>
                  <td>{s.next_collection_date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="Todavía no hay suscripciones" description="No se han creado contratos recurrentes." />
      )}
    </>
  );
}
