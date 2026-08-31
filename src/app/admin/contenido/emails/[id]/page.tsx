import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Badge } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";

const TEMPLATE_STATUS: Record<string, { label: string; variant: "neutral" | "warning" | "success" | "error" | "information" }> = {
  draft: { label: "Borrador", variant: "neutral" },
  active: { label: "Activa", variant: "success" },
  archived: { label: "Archivada", variant: "neutral" },
};

export default async function Template({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db: any = await createClient();
  const { data } = await db.from("notification_templates").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();

  const status = TEMPLATE_STATUS[data.status] ?? { label: data.status, variant: "neutral" as const };

  return (
    <>
      <AdminPageHeader
        title={data.name}
        description={`${data.key} · versión ${data.version}`}
        actions={<Badge variant={status.variant}>{status.label}</Badge>}
      />
      <h2>Asunto</h2>
      <p>{data.subject_template}</p>
      <h2>Texto</h2>
      <pre>{data.body_text_template}</pre>
      <h2>Variables</h2>
      <p>{data.required_variables?.join(", ") || "Sin variables obligatorias"}</p>
      {data.status === "draft" ? (
        <p className="field__help">Plantilla en borrador, todavía sin publicar.</p>
      ) : (
        <p className="field__help">Las versiones activas son inmutables. Crea una nueva versión para cambiarla.</p>
      )}
    </>
  );
}
