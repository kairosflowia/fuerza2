import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

const TEMPLATE_STATUS: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "error" | "information" }> = {
  draft: { label: "Borrador", variant: "neutral" },
  active: { label: "Activa", variant: "success" },
  archived: { label: "Archivada", variant: "neutral" },
};

export default async function EmailTemplates() {
  const db: any = await createClient();
  const { data } = await db
    .from("notification_templates")
    .select("id,key,name,locale,status,version,required_variables")
    .order("key")
    .order("version", { ascending: false });

  return (
    <>
      <AdminPageHeader title="Plantillas de email" description="Versiones auditables de comunicaciones transaccionales." />
      {data?.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>Evento</th><th>Idioma</th><th>Versión</th><th>Estado</th></tr>
            </thead>
            <tbody>
              {data.map((template: any) => {
                const status = TEMPLATE_STATUS[template.status] ?? { label: template.status, variant: "neutral" as const };
                return (
                  <tr key={template.id}>
                    <td><Link href={`/admin/contenido/emails/${template.id}`}>{template.name}</Link></td>
                    <td>{template.locale}</td>
                    <td>{template.version}</td>
                    <td><Badge variant={status.variant}>{status.label}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState title="No hay plantillas" description="Las plantillas de comunicaciones transaccionales aparecerán aquí." />
      )}
      <Link href="/admin/contenido/emails/preview">Previsualizar una plantilla</Link>
    </>
  );
}
