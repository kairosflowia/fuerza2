import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { signOutAction, updateNotificationPreferences, updatePushPreferences } from "./actions";
import { AccountSubscriptionsCard } from "@/components/account/subscriptions-card";
import { ProfileForm } from "@/components/account/profile-form";
import { PushNotifications } from "@/components/account/push-notifications";
import { PageIntro } from "@/components/public/page-intro";
import { Badge, Button, Card, Checkbox, Container, EmptyState, Section } from "@/components/ui";
import { getCurrentIdentity } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Mi cuenta", description: "Gestiona tu perfil FUERZA.", path: "/cuenta" });

const ORDER_STATUS_LABELS_ES: Record<string, string> = {
  draft: "Borrador",
  pending_payment: "Pago pendiente",
  payment_processing: "Procesando pago",
  confirmed: "Confirmado",
  ready: "Listo para recoger",
  collected: "Recogido",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
  partially_refunded: "Reembolso parcial",
};

const ORDER_BADGE_VARIANT: Record<string, "success" | "warning" | "neutral"> = {
  confirmed: "success",
  ready: "success",
  collected: "success",
  pending_payment: "warning",
  payment_processing: "warning",
  partially_refunded: "warning",
  draft: "neutral",
  cancelled: "neutral",
  refunded: "neutral",
};

function initialsFor(name: string, email: string) {
  const source = name.trim() || email;
  const parts = source.trim().split(/\s+/).filter(Boolean);
  return (parts.slice(0, 2).map((part) => part[0]).join("") || "?").toUpperCase();
}

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
  const { data: subscriptions } = await (supabase as any).from("subscriptions").select("id,status,frequency,next_collection_date,total_cents,pickup_points(name)").eq("customer_id",identity.user.id).order("created_at",{ascending:false});
  const subscriptionSummaries = (subscriptions ?? []).map((s: any) => ({ id: s.id, status: s.status, frequency: s.frequency, next_collection_date: s.next_collection_date, total_cents: s.total_cents, pickupPointName: s.pickup_points?.name ?? null }));
  const fullName = identity.profile?.full_name ?? "";
  const initials = initialsFor(fullName, identity.user.email ?? "");

  return (
    <main id="main-content">
      <PageIntro eyebrow="Sesión activa" title="Mi cuenta" description="Tus datos, pedidos y membresías de Fuerza Habitual, todo en un mismo sitio." />
      <Section>
        <Container size="wide">
          <div className="account-shell">
            <aside className="account-sidebar">
              <Card className="account-sidebar__card">
                <div className="account-sidebar__avatar" aria-hidden="true">{initials}</div>
                <p className="account-sidebar__email">{identity.user.email}</p>
                <div className="account-sidebar__roles">{identity.roles.map((role) => <Badge key={role}>{role}</Badge>)}</div>

                <hr className="account-sidebar__divider" />

                <p className="account-section__eyebrow">Editar perfil</p>
                <ProfileForm fullName={fullName} phone={identity.profile?.phone ?? ""} />

                <form action={signOutAction}>
                  <Button variant="secondary" type="submit" fullWidth>Cerrar sesión</Button>
                </form>
              </Card>
            </aside>

            <div className="account-main">
              <section className="account-section">
                <p className="account-section__eyebrow">Fuerza Habitual</p>
                <h2>Tus membresías</h2>
                <AccountSubscriptionsCard subscriptions={subscriptionSummaries} />
              </section>

              <section className="account-section">
                <p className="account-section__eyebrow">Historial</p>
                <h2>Pedidos recientes</h2>
                {orders?.length ? (
                  <ul className="account-list">
                    {orders.map((order) => (
                      <li key={order.id}>
                        <span><strong>{order.public_code}</strong> · {order.collection_date}</span>
                        <span className="account-list__meta">
                          <Badge variant={ORDER_BADGE_VARIANT[order.status] ?? "neutral"}>{ORDER_STATUS_LABELS_ES[order.status] ?? order.status}</Badge>
                          {(order.total_cents / 100).toLocaleString("es-ES", { style: "currency", currency: order.currency })}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="Todavía no hay pedidos" description="Tus pedidos confirmados aparecerán aquí." />
                )}
              </section>

              <section className="account-section">
                <p className="account-section__eyebrow">Preferencias</p>
                <h2>Comunicaciones</h2>
                <p className="account-section__hint">Las confirmaciones de pedido y los avisos operativos necesarios permanecen activos.</p>
                <form action={updateNotificationPreferences} className="account-form">
                  <Checkbox id="comm-subscription" name="subscription" label="Avisos por email sobre Plan de Pan" defaultChecked={preference("email", "subscription", true)} />
                  <Checkbox id="comm-reminder" name="reminder" label="Recordatorios de recogida por email" defaultChecked={preference("email", "reminder", true)} />
                  <Checkbox id="comm-marketing" name="marketing" label="Novedades y promociones" defaultChecked={preference("email", "marketing", false)} />
                  <Button type="submit">Guardar preferencias</Button>
                </form>
              </section>

              <section className="account-section">
                <p className="account-section__eyebrow">Preferencias</p>
                <h2>Notificaciones push</h2>
                <PushNotifications initialDevices={pushDevices ?? []} />
                <form action={updatePushPreferences} className="account-form">
                  <p className="account-section__hint">Elige qué avisos opcionales quieres recibir en tus dispositivos. Los avisos imprescindibles del pedido permanecen activos.</p>
                  <Checkbox id="push-subscription" name="push_subscription" label="Avisos de Plan de Pan" defaultChecked={preference("push", "subscription", true)} />
                  <Checkbox id="push-reminder" name="push_reminder" label="Recordatorios de recogida" defaultChecked={preference("push", "reminder", true)} />
                  <Button type="submit">Guardar avisos push</Button>
                </form>
              </section>

              <section className="account-section">
                <p className="account-section__eyebrow">Privacidad</p>
                <h2>Consentimientos</h2>
                {consents?.length ? (
                  <ul className="account-list">
                    {consents.map((consent) => (
                      <li key={`${consent.consent_type}-${consent.created_at}`}>
                        <span>{consent.consent_type}</span>
                        <span className="account-list__meta">
                          <Badge variant={consent.granted ? "success" : "neutral"}>{consent.granted ? "Concedido" : "Retirado"}</Badge>
                          versión {consent.version}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState title="Sin consentimientos registrados" description="Los consentimientos aparecerán aquí cuando utilices una función que los requiera." />
                )}
              </section>
            </div>
          </div>
        </Container>
      </Section>
    </main>
  );
}
