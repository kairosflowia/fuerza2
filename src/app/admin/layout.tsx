import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { canAccessAdmin } from "@/lib/auth/permissions";
import { getCurrentIdentity } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: {
    default: "Administración",
    template: "%s · Administración · FUERZA",
  },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) redirect("/cuenta/acceder?next=/admin");
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/cuenta/acceder?next=/admin");
  if (!canAccessAdmin(identity.roles)) {
    const supabase = await createClient();
    await supabase.rpc("log_admin_event", { event_action: "admin.access_denied" });
    redirect("/cuenta/acceso-denegado");
  }
  return (
    <>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <AdminShell email={identity.user.email ?? "Usuario"} roles={identity.roles}>{children}</AdminShell>
    </>
  );
}
