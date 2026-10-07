import type { Metadata } from "next";

import { signOutAction, updateNotificationPreferences, updatePushPreferences } from "../actions";
import { PreferenceToggles } from "@/components/account/preference-toggles";
import { ProfileForm } from "@/components/account/profile-form";
import { PushNotifications } from "@/components/account/push-notifications";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ChevronRightIcon } from "@/components/ui/icons";
import { requireAccount } from "@/lib/account";
import { formatDateEs } from "@/lib/order-cutoff";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Perfil y preferencias", robots: { index: false, follow: false } };

const CONSENT_LABELS_ES: Record<string, string> = {
  privacy: "Política de privacidad",
  terms: "Condiciones de compra",
  marketing: "Comunicaciones comerciales",
  newsletter: "Newsletter",
  contact: "Formulario de contacto",
};

export default async function AccountProfilePage() {
  const account = await requireAccount("/cuenta/perfil");
  const db: any = await createClient();
  const [{ data: preferences }, { data: pushDevices }, { data: consents }] = await Promise.all([
    db.from("notification_preferences").select("channel,category,enabled").eq("customer_id", account.userId),
    db.from("push_subscription_metadata").select("id,platform,device_name,status,last_used_at,created_at").eq("customer_id", account.userId).order("created_at", { ascending: false }),
    db.from("customer_consents").select("consent_type,granted,version,created_at").eq("customer_id", account.userId).order("created_at", { ascending: false }),
  ]);
  const preference = (channel: string, category: string, fallback: boolean) =>
    (preferences ?? []).find((p: { channel: string; category: string; enabled: boolean }) => p.channel === channel && p.category === category)?.enabled ?? fallback;

  return (
    <main id="main-content" className="fz-account">
      <div className="fz-container fz-account__container">
        <header className="fz-account__intro">
          <Breadcrumbs items={[{ label: "Mi FUERZA", href: "/cuenta" }, { label: "Perfil" }]} />
          <h1 className="fz-display">Perfil y preferencias</h1>
          <p>Gestiona tus datos, tus comunicaciones y elige cómo quieres que te mantengamos al día.</p>
        </header>

        <ProfileForm fullName={account.fullName} phone={account.phone} email={account.email} initials={account.initials} />

        <section className="fz-acard" aria-labelledby="comms-title">
          <h2 id="comms-title" className="fz-acard__section-title">Comunicaciones</h2>
          <p className="fz-acard__text">Las confirmaciones de pedido y los avisos operativos necesarios permanecen activos.</p>
          <PreferenceToggles
            action={updateNotificationPreferences}
            legend="Comunicaciones por email"
            items={[
              { name: "subscription", label: "Avisos por email sobre Plan de Pan", description: "Novedades, disponibilidad y consejos.", defaultChecked: preference("email", "subscription", true) },
              { name: "reminder", label: "Recordatorios de recogida por email", description: "Te avisamos cuando tu pedido esté listo.", defaultChecked: preference("email", "reminder", true) },
              { name: "marketing", label: "Novedades y promociones", description: "Recibe noticias, lanzamientos y ofertas especiales.", defaultChecked: preference("email", "marketing", false) },
            ]}
          />
        </section>

        <section className="fz-acard" aria-labelledby="push-title">
          <h2 id="push-title" className="fz-acard__section-title">Notificaciones push</h2>
          <p className="fz-acard__text">Activa los avisos para saber cuándo tu pedido está listo. No pediremos permiso sin que pulses el botón.</p>
          <PushNotifications initialDevices={pushDevices ?? []} />
          <p className="fz-acard__eyebrow fz-acard__eyebrow--divider">Avisos opcionales</p>
          <PreferenceToggles
            action={updatePushPreferences}
            legend="Avisos push opcionales"
            items={[
              { name: "push_subscription", label: "Avisos de Plan de Pan", description: "Novedades y recordatorios en tiempo real.", defaultChecked: preference("push", "subscription", true) },
              { name: "push_reminder", label: "Recordatorios de recogida", description: "Te avisamos cuando tu pedido esté listo.", defaultChecked: preference("push", "reminder", true) },
            ]}
          />
        </section>

        <section className="fz-acard" aria-labelledby="privacy-title">
          <h2 id="privacy-title" className="fz-acard__section-title">Privacidad</h2>
          <details className="fz-disclosure">
            <summary>
              <span>
                <strong>Consentimientos</strong>
                {consents?.length
                  ? `${consents.length} ${consents.length === 1 ? "registro" : "registros"} guardados.`
                  : "Los consentimientos aparecerán aquí cuando utilices una función que los requiera."}
              </span>
              <ChevronRightIcon aria-hidden="true" />
            </summary>
            {consents?.length ? (
              <ul className="fz-consent-list">
                {consents.map((consent: { consent_type: string; granted: boolean; version: string; created_at: string }) => (
                  <li key={`${consent.consent_type}-${consent.created_at}`}>
                    <span>{CONSENT_LABELS_ES[consent.consent_type] ?? consent.consent_type}<small>Versión {consent.version} · {formatDateEs(consent.created_at.slice(0, 10))}</small></span>
                    <span className={`fz-chip-status fz-chip-status--small${consent.granted ? " fz-chip-status--ok" : ""}`}><span aria-hidden="true" />{consent.granted ? "Concedido" : "Retirado"}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </details>
        </section>

        <form action={signOutAction} className="fz-account__signout">
          <button type="submit" className="fz-btn-secondary">Cerrar sesión</button>
        </form>
      </div>
    </main>
  );
}
