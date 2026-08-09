import { redirect } from "next/navigation";

import { CutoffSettingsForm } from "@/components/admin/cutoff-settings-form";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Alert, Card } from "@/components/ui";
import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ReservationCutoffPage() {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "configuracion")) redirect("/cuenta/acceso-denegado");

  const db = await createClient();
  const { data } = await db.from("app_settings").select("key,value").in("key", ["availability.cutoff_days_before", "availability.cutoff_time"]);
  const daysBeforeValue = data?.find((row) => row.key === "availability.cutoff_days_before")?.value;
  const timeValue = data?.find((row) => row.key === "availability.cutoff_time")?.value;
  const daysBefore = typeof daysBeforeValue === "number" ? daysBeforeValue : 2;
  const time = typeof timeValue === "string" ? timeValue.slice(0, 5) : "10:00";
  const configured = typeof daysBeforeValue === "number" && typeof timeValue === "string";

  return (
    <>
      <AdminPageHeader title="Antelación de reserva" description="Antelación mínima exigida antes de recoger un pedido (Documento funcional del cliente, sección 2)." />
      {!configured ? (
        <Alert variant="warning" title="Sin configurar">
          Sin estos dos valores, ninguna fecha admite reserva: el sistema trata todo como cerrado por seguridad.
        </Alert>
      ) : null}
      <Card>
        <CutoffSettingsForm daysBefore={daysBefore} time={time} />
      </Card>
    </>
  );
}
