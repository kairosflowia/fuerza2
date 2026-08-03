import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOutAction } from "./actions";
import { ProfileForm } from "@/components/account/profile-form";
import { PageIntro } from "@/components/public/page-intro";
import { Badge, Button, Card, Container, EmptyState, Section } from "@/components/ui";
import { getCurrentIdentity } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Mi cuenta", description: "Gestiona tu perfil FUERZA.", path: "/cuenta" });

export default async function AccountPage() {
  if (!isSupabaseConfigured()) redirect("/cuenta/acceder");
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/cuenta/acceder?next=/cuenta");
  const supabase = await createClient();
  const { data: consents } = await supabase.from("customer_consents").select("consent_type, granted, version, created_at").eq("customer_id", identity.user.id).order("created_at", { ascending: false });

  return (
    <main id="main-content">
      <PageIntro eyebrow="Sesión activa" title="Mi cuenta" description="Tus datos básicos y el espacio para los servicios que llegarán más adelante." />
      <Section><Container size="wide" className="account-grid">
        <Card className="account-card">
          <h2>Perfil</h2>
          <p><strong>Correo:</strong> {identity.user.email}</p>
          <ProfileForm fullName={identity.profile?.full_name ?? ""} phone={identity.profile?.phone ?? ""} />
        </Card>
        <Card className="account-card">
          <h2>Sesión y permisos</h2>
          <p>Sesión verificada con Supabase.</p>
          <div className="component-row">{identity.roles.map((role) => <Badge key={role}>{role}</Badge>)}</div>
          <form action={signOutAction}><Button variant="secondary" type="submit">Cerrar sesión</Button></form>
        </Card>
        <Card className="account-card">
          <h2>Consentimientos</h2>
          {consents?.length ? <ul>{consents.map((consent) => <li key={`${consent.consent_type}-${consent.created_at}`}>{consent.consent_type}: {consent.granted ? "concedido" : "retirado"} · versión {consent.version}</li>)}</ul> : <EmptyState title="Sin consentimientos registrados" description="Los consentimientos aparecerán aquí cuando utilices una función que los requiera." />}
        </Card>
        <Card className="account-card"><EmptyState title="Todavía no hay pedidos" description="Tus pedidos aparecerán aquí cuando activemos las reservas." /></Card>
        <Card className="account-card"><EmptyState title="Plan de Pan todavía no disponible" description="Las futuras suscripciones aparecerán aquí cuando el servicio esté estable." /></Card>
      </Container></Section>
    </main>
  );
}
