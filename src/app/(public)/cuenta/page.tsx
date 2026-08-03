import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOutAction, updateNotificationPreferences, updatePushPreferences } from "./actions";
import { ProfileForm } from "@/components/account/profile-form";
import { PushNotifications } from "@/components/account/push-notifications";
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
  const { data: orders } = await supabase.from("orders").select("id,public_code,status,payment_status,collection_date,total_cents,currency").eq("customer_id",identity.user.id).order("created_at",{ascending:false}).limit(10);
  const { data: preferences } = await (supabase as any).from("notification_preferences").select("channel,category,enabled").eq("customer_id",identity.user.id);
  const preference = (channel: string, category: string, fallback: boolean) => preferences?.find((item: { channel: string; category: string; enabled: boolean }) => item.channel === channel && item.category === category)?.enabled ?? fallback;
  const { data: pushDevices } = await (supabase as any).from("push_subscription_metadata").select("id,platform,device_name,status,last_used_at,created_at").eq("customer_id",identity.user.id).order("created_at",{ascending:false});

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
        <Card className="account-card"><h2>Pedidos recientes</h2>{orders?.length?<ul>{orders.map(order=><li key={order.id}><strong>{order.public_code}</strong> · {order.collection_date} · {order.status} · {(order.total_cents/100).toLocaleString("es-ES",{style:"currency",currency:order.currency})}</li>)}</ul>:<EmptyState title="Todavía no hay pedidos" description="Tus pedidos confirmados aparecerán aquí." />}</Card>
        <Card className="account-card"><EmptyState title="Plan de Pan todavía no disponible" description="Las futuras suscripciones aparecerán aquí cuando el servicio esté estable." /></Card>
        <Card className="account-card"><h2>Comunicaciones</h2><p>Las confirmaciones de pedido y los avisos operativos necesarios permanecen activos.</p><form action={updateNotificationPreferences}><label><input type="checkbox" name="subscription" defaultChecked={preference("email","subscription",true)}/> Avisos por email sobre Plan de Pan</label><label><input type="checkbox" name="reminder" defaultChecked={preference("email","reminder",true)}/> Recordatorios de recogida por email</label><label><input type="checkbox" name="marketing" defaultChecked={preference("email","marketing",false)}/> Novedades y promociones</label><Button type="submit">Guardar preferencias</Button></form></Card>
        <Card className="account-card"><PushNotifications initialDevices={pushDevices??[]}/><form action={updatePushPreferences}><p>Elige qué avisos opcionales quieres recibir en tus dispositivos. Los avisos imprescindibles del pedido permanecen activos.</p><label><input type="checkbox" name="push_subscription" defaultChecked={preference("push","subscription",true)}/> Avisos de Plan de Pan</label><label><input type="checkbox" name="push_reminder" defaultChecked={preference("push","reminder",true)}/> Recordatorios de recogida</label><Button type="submit">Guardar avisos push</Button></form></Card>
      </Container></Section>
    </main>
  );
}
