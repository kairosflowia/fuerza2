import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOutAction, updateNotificationPreferences, updatePushPreferences } from "./actions";
import { AccountSubscriptionsCard } from "@/components/account/subscriptions-card";
import { ProfileForm } from "@/components/account/profile-form";
import { PushNotifications } from "@/components/account/push-notifications";
import { RepeatOrderButton, type RepeatableItem } from "@/components/account/repeat-order-button";
import { PageIntro } from "@/components/public/page-intro";
import { Badge, Button, Card, Checkbox, Container, EmptyState, Section } from "@/components/ui";
import { getCurrentIdentity } from "@/lib/auth/session";
import { formatDateEs } from "@/lib/order-cutoff";
import { ORDER_STATUS_BADGE_VARIANT, orderStatusLabel } from "@/lib/order-status-domain";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Mi FUERZA", description: "Tu próxima recogida, tus pedidos y tu Fuerza Habitual, en un mismo sitio.", path: "/cuenta" });

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
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: consents }, { data: orders }, { data: nextOrders }, { data: preferences }, { data: pushDevices }, { data: subscriptions }] = await Promise.all([
    supabase.from("customer_consents").select("consent_type, granted, version, created_at").eq("customer_id", identity.user.id).order("created_at", { ascending: false }),
    supabase.from("orders").select("id,public_code,status,payment_status,collection_date,total_cents,currency,pickup_point_id").eq("customer_id", identity.user.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("orders").select("id,public_code,collection_date,pickup_point_id").eq("customer_id", identity.user.id).in("status", ["confirmed", "ready"]).gte("collection_date", today).order("collection_date", { ascending: true }).limit(1),
    (supabase as any).from("notification_preferences").select("channel,category,enabled").eq("customer_id", identity.user.id),
    (supabase as any).from("push_subscription_metadata").select("id,platform,device_name,status,last_used_at,created_at").eq("customer_id", identity.user.id).order("created_at", { ascending: false }),
    (supabase as any).from("subscriptions").select("id,status,frequency,next_collection_date,total_cents,pickup_point_id").eq("customer_id", identity.user.id).order("created_at", { ascending: false }),
  ]);

  // pickup_points (la tabla completa) tiene RLS restringido al equipo del
  // obrador: para un cliente autenticado, un embed orders->pickup_points(name)
  // vuelve nulo. Se resuelven los nombres aparte contra pickup_points_public,
  // la misma vista de solo lectura que ya usa todo el sitio público.
  const pickupPointIds = [...new Set([...(orders ?? []).map((o) => o.pickup_point_id), ...(nextOrders ?? []).map((o) => o.pickup_point_id), ...(subscriptions ?? []).map((s: any) => s.pickup_point_id)].filter(Boolean))];
  const { data: pickupPointRows } = pickupPointIds.length
    ? await supabase.from("pickup_points_public").select("id,name").in("id", pickupPointIds)
    : { data: [] };
  const pickupPointName = (id: string | null) => (pickupPointRows ?? []).find((p) => p.id === id)?.name ?? null;

  const preference = (channel: string, category: string, fallback: boolean) => preferences?.find((item: { channel: string; category: string; enabled: boolean }) => item.channel === channel && item.category === category)?.enabled ?? fallback;
  const subscriptionSummaries = (subscriptions ?? []).map((s: any) => ({ id: s.id, status: s.status, frequency: s.frequency, next_collection_date: s.next_collection_date, total_cents: s.total_cents, pickupPointName: pickupPointName(s.pickup_point_id) }));
  const fullName = identity.profile?.full_name ?? "";
  const initials = initialsFor(fullName, identity.user.email ?? "");
  const nextOrder = nextOrders?.[0] as any;

  // "Repetir pedido": solo para pedidos que ya llegaron a confirmarse (no
  // borradores ni cancelados), y solo con las variantes que siguen activas y
  // con precio hoy -- las que ya no existen se omiten en silencio en vez de
  // bloquear el repetir el resto.
  const repeatableOrderIds = (orders ?? []).filter((o) => !["draft", "cancelled"].includes(o.status)).map((o) => o.id);
  const { data: items } = repeatableOrderIds.length
    ? await supabase.from("order_items").select("order_id,product_id,product_variant_id,product_name_snapshot,variant_name_snapshot,quantity").in("order_id", repeatableOrderIds)
    : { data: [] };
  const variantIds = [...new Set((items ?? []).map((i) => i.product_variant_id))];
  const productIds = [...new Set((items ?? []).map((i) => i.product_id).filter((id): id is string => Boolean(id)))];
  const [{ data: variants }, { data: images }] = await Promise.all([
    variantIds.length ? supabase.from("product_variants").select("id,price_cents,status").in("id", variantIds) : Promise.resolve({ data: [] }),
    productIds.length ? supabase.from("product_images").select("product_id,storage_path,is_primary").in("product_id", productIds) : Promise.resolve({ data: [] }),
  ]);
  const repeatItemsByOrder = new Map<string, RepeatableItem[]>();
  for (const item of items ?? []) {
    const variant = (variants ?? []).find((v) => v.id === item.product_variant_id);
    if (!variant || variant.status !== "active" || variant.price_cents === null) continue;
    const image = (images ?? []).find((i) => i.product_id === item.product_id && i.is_primary) ?? (images ?? []).find((i) => i.product_id === item.product_id);
    const list = repeatItemsByOrder.get(item.order_id) ?? [];
    list.push({ variantId: item.product_variant_id, productName: item.product_name_snapshot, variantName: item.variant_name_snapshot, quantity: item.quantity, priceCents: variant.price_cents, image: image?.storage_path });
    repeatItemsByOrder.set(item.order_id, list);
  }

  return (
    <main id="main-content">
      <PageIntro eyebrow="Sesión activa" title="Mi FUERZA" description="Tu próxima recogida, tus pedidos y tu Fuerza Habitual, todo en un mismo sitio." />
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
                <p className="account-section__eyebrow">Lo próximo</p>
                <h2>Próxima recogida</h2>
                {nextOrder ? (
                  <Card>
                    <p className="account-list__meta"><strong>{nextOrder.public_code}</strong> · {formatDateEs(nextOrder.collection_date)}</p>
                    <p>{pickupPointName(nextOrder.pickup_point_id) ?? "Punto de recogida"}</p>
                  </Card>
                ) : (
                  <EmptyState title="No tienes ninguna recogida próxima" description="Cuando reserves pan, tu próxima recogida aparecerá aquí." action={<Link className="button button--primary" href="/reserva-y-recoge">Reservar y recoge</Link>} />
                )}
              </section>

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
                        <span><strong>{order.public_code}</strong> · {pickupPointName(order.pickup_point_id) ?? "Punto de recogida"} · {formatDateEs(order.collection_date)}</span>
                        <span className="account-list__meta">
                          <Badge variant={ORDER_STATUS_BADGE_VARIANT[order.status] ?? "neutral"}>{orderStatusLabel(order.status)}</Badge>
                          {(order.total_cents / 100).toLocaleString("es-ES", { style: "currency", currency: order.currency })}
                        </span>
                        <RepeatOrderButton items={repeatItemsByOrder.get(order.id) ?? []} />
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
