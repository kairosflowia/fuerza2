import { redirect } from "next/navigation";

import { canAccessAdminSection } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";

export default async function ContenidoIndexPage() {
  const identity = await getCurrentIdentity();
  if (!identity || !canAccessAdminSection(identity.roles, "contenido")) redirect("/cuenta/acceso-denegado");
  redirect("/admin/contenido/emails");
}
