import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, EmptyState } from "@/components/ui";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

import { setContactMessageStatus } from "./actions";

export const dynamic = "force-dynamic";

const REASON_LABELS_ES: Record<string, string> = {
  general: "Consulta general",
  recogida: "Reserva y recogida",
  colaboracion: "Colaboración",
};

const STATUS_CHIPS = [
  { value: "", label: "Todos" },
  { value: "nuevo", label: "Nuevos" },
  { value: "atendido", label: "Atendidos" },
  { value: "descartado", label: "Descartados" },
] as const;

export default async function ContactMessagesPage({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "mensajes")) redirect("/cuenta/acceso-denegado");

  const state = (await searchParams).estado ?? "";
  const db = (await createClient()) as any;
  const { data } = await db.rpc("admin_contact_messages", { p_status: state || null });
  const messages = data ?? [];
  const newCount = messages.filter((m: any) => m.status === "nuevo").length;

  return (
    <>
      <AdminPageHeader title="Mensajes" description="Consultas recibidas desde el formulario de contacto público." />

      <nav className="admin-tabs" aria-label="Filtrar por estado">
        {STATUS_CHIPS.map((chip) => (
          <Link
            key={chip.value}
            href={chip.value ? `/admin/mensajes?estado=${chip.value}` : "/admin/mensajes"}
            aria-current={state === chip.value ? "page" : undefined}
          >
            {chip.label}{chip.value === "nuevo" && newCount ? ` (${newCount})` : ""}
          </Link>
        ))}
      </nav>

      {messages.length ? (
        <ul className="inventory-list">
          {messages.map((message: any) => (
            <li key={message.id} className="inventory-row">
              <div className="inventory-row__main">
                <p className="inventory-row__product">
                  {message.name} · <a href={`mailto:${message.email}`}>{message.email}</a>
                  {message.phone ? ` · ${message.phone}` : ""}
                </p>
                <p className="inventory-row__variant">
                  {REASON_LABELS_ES[message.reason] ?? message.reason} · {new Date(message.created_at).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" })}
                </p>
                <p>{message.message}</p>
              </div>
              <div className="inventory-row__stock">
                <Badge variant={message.status === "nuevo" ? "warning" : message.status === "atendido" ? "success" : "neutral"}>
                  {message.status === "nuevo" ? "Nuevo" : message.status === "atendido" ? "Atendido" : "Descartado"}
                </Badge>
              </div>
              {message.status === "nuevo" ? (
                <div className="inventory-row__actions">
                  <form action={setContactMessageStatus}>
                    <input type="hidden" name="id" value={message.id} />
                    <input type="hidden" name="status" value="atendido" />
                    <button type="submit" className="button button--primary">Marcar atendido</button>
                  </form>
                  <form action={setContactMessageStatus}>
                    <input type="hidden" name="id" value={message.id} />
                    <input type="hidden" name="status" value="descartado" />
                    <button type="submit" className="button button--secondary">Descartar</button>
                  </form>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title={state ? "No hay mensajes con este estado" : "Todavía no hay mensajes"}
          description="Los mensajes enviados desde el formulario de contacto aparecerán aquí."
        />
      )}
    </>
  );
}
