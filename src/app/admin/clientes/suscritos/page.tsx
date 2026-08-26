import { redirect } from "next/navigation";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { CustomerTabs } from "@/components/admin/customer-tabs";
import { NewsletterConsentHistoryDrawer } from "@/components/admin/newsletter-consent-history-drawer";
import { NewsletterStatusActions } from "@/components/admin/newsletter-status-actions";
import { Badge, EmptyState } from "@/components/ui";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = { pendiente: "Pendiente", activo: "Activo", baja: "Baja", bloqueado: "Bloqueado" };
const STATUS_VARIANT: Record<string, "success" | "warning" | "neutral" | "error"> = { pendiente: "warning", activo: "success", baja: "neutral", bloqueado: "error" };

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString("es-ES", { dateStyle: "medium" }) : "—";
}

export default async function NewsletterSubscribersPage({ searchParams }: { searchParams: Promise<{ q?: string; estado?: string }> }) {
  const { q = "", estado = "" } = await searchParams;
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "clientes")) redirect("/cuenta/acceso-denegado");

  const db = await createClient();
  const { data: subscribers } = await db.rpc("admin_newsletter_directory", { p_query: q.trim() || null, p_status: estado || null });

  return (
    <>
      <AdminPageHeader
        title="Suscritos a la newsletter"
        description="Alta con double opt-in: nadie queda activo hasta confirmar por correo."
        actions={<a className="button button--secondary" href={`/api/admin/clientes/suscritos/export${estado ? `?estado=${estado}` : ""}`}>Exportar CSV</a>}
      />
      <CustomerTabs />
      <form className="admin-filters">
        <label>Buscar<input type="search" name="q" defaultValue={q} placeholder="Correo…" /></label>
        <label>
          Estado
          <select name="estado" defaultValue={estado}>
            <option value="">Todos</option>
            <option value="activo">Activos</option>
            <option value="pendiente">Pendientes</option>
            <option value="baja">Baja</option>
            <option value="bloqueado">Bloqueados</option>
          </select>
        </label>
        <button type="submit" className="button button--primary">Filtrar</button>
      </form>
      {subscribers?.length ? (
        <ul className="inventory-list">
          {subscribers.map((s) => (
            <li key={s.id} className="inventory-row">
              <div className="inventory-row__main">
                <p className="inventory-row__product">{s.email}</p>
                <p className="inventory-row__variant">
                  Alta {formatDate(s.subscribed_at)} · {s.source}
                  {s.confirmed_at ? ` · Confirmado ${formatDate(s.confirmed_at)}` : ""}
                  {s.customer_id ? " · Cliente con cuenta" : ""}
                </p>
              </div>
              <div className="inventory-row__stock">
                <Badge variant={STATUS_VARIANT[s.status] ?? "neutral"}>{STATUS_LABEL[s.status] ?? s.status}</Badge>
                <span className="inventory-row__qty">Última actividad {formatDate(s.last_activity_at)}</span>
              </div>
              <div className="inventory-row__actions">
                <NewsletterStatusActions subscriberId={s.id} status={s.status} canReactivate={s.can_reactivate} />
                <NewsletterConsentHistoryDrawer subscriberId={s.id} email={s.email} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={q || estado ? "Sin resultados" : "Todavía no hay ningún suscrito"}
          description={q || estado ? "Ningún suscrito coincide con ese filtro." : "Aparecerán aquí en cuanto alguien se suscriba desde la web."}
        />
      )}
    </>
  );
}
