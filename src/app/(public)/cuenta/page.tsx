import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { signOutAction } from "./actions";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ArrowRightIcon, CalendarIcon, PackageIcon, PinIcon, WheatIcon } from "@/components/ui/icons";
import { loadAccountOrders, loadAccountPlan, requireAccount, upcomingOrders } from "@/lib/account";
import { formatPrice } from "@/lib/catalog-domain";
import { formatDateEs, formatTime } from "@/lib/order-cutoff";
import { orderStatusLabel } from "@/lib/order-status-domain";
import { createPageMetadata } from "@/lib/seo";
import { PLAN_TITLE_ES, subscriptionStatusLabel, weekdaysPhraseEs, FREQUENCY_LABELS_ES } from "@/lib/subscriptions-domain";

export const metadata: Metadata = createPageMetadata({ title: "Mi FUERZA", description: "Tu próxima recogida, tus pedidos y tu Plan de Pan, en un mismo sitio.", path: "/cuenta" });

const joinEs = (parts: string[]) => (parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}`);

export default async function AccountPage() {
  const account = await requireAccount("/cuenta");
  const [orders, plan] = await Promise.all([loadAccountOrders(account.userId, { limit: 20 }), loadAccountPlan(account.userId)]);
  const next = upcomingOrders(orders)[0];
  const recent = orders.slice(0, 2);
  const planActive = plan && ["active", "trialing"].includes(plan.status);

  return (
    <main id="main-content" className="fz-account">
      <div className="fz-container fz-account__container">
        <header className="fz-account__intro">
          <Breadcrumbs items={[{ label: "Mi FUERZA" }]} />
          <p className="fz-eyebrow fz-eyebrow--muted">Sesión activa</p>
          <h1 className="fz-display">Mi FUERZA</h1>
          <p>Tu próxima recogida, tus pedidos y tu Plan de Pan, todo en un mismo sitio.</p>
        </header>

        <section className="fz-acard fz-acard--media" aria-labelledby="next-title">
          <div className="fz-acard__row">
            <span className="fz-acard__icon" aria-hidden="true"><CalendarIcon /></span>
            <div className="fz-acard__body">
              <p className="fz-acard__eyebrow">Próxima recogida</p>
              {next ? (
                <>
                  <h2 id="next-title" className="fz-acard__title">{formatDateEs(next.collectionDate)}</h2>
                  {next.window ? <p className="fz-acard__strong">{formatTime(next.window.startsAt)} – {formatTime(next.window.endsAt)}</p> : null}
                  {next.pointName ? (
                    <p className="fz-acard__place">
                      <PinIcon aria-hidden="true" />
                      <span><strong>{next.pointName}</strong>{next.pointAddress ? <small>{next.pointAddress}</small> : null}</span>
                    </p>
                  ) : null}
                </>
              ) : (
                <>
                  <h2 id="next-title" className="fz-acard__title">No tienes ninguna recogida próxima</h2>
                  <p className="fz-acard__text">Cuando reserves pan, aparecerá aquí.</p>
                </>
              )}
            </div>
            <div className="fz-acard__photo">
              <Image src={next?.imagePath ? `/api/product-images/${next.imagePath}` : "/images/home/hero-pan-rustico-madera.jpg"} alt="" fill sizes="(min-width: 48rem) 220px, 120px" />
            </div>
          </div>
          {next ? (
            <Link className="fz-btn fz-btn--block" href={`/cuenta/pedidos/${next.id}`}>Ver pedido y detalles<ArrowRightIcon /></Link>
          ) : (
            <Link className="fz-btn fz-btn--block" href="/reserva-y-recoge">Reservar pan<ArrowRightIcon /></Link>
          )}
        </section>

        <section className="fz-acard fz-acard--media" aria-labelledby="plan-title">
          <div className="fz-acard__row">
            <span className="fz-acard__icon" aria-hidden="true"><WheatIcon /></span>
            <div className="fz-acard__body">
              <p className="fz-acard__eyebrow">Plan de Pan</p>
              {plan ? (
                <>
                  <h2 id="plan-title" className="fz-acard__title">{PLAN_TITLE_ES[plan.frequency] ?? "Plan de Pan"}</h2>
                  <p className="fz-acard__text">
                    <span className="fz-acard__ink">{joinEs(plan.items.map((i) => i.name))}</span>, {FREQUENCY_LABELS_ES[plan.frequency]?.toLowerCase()} {plan.weekdays.length ? weekdaysPhraseEs(plan.weekdays) : ""} en {plan.pointName ?? "tu punto de recogida"}.
                  </p>
                  <span className={`fz-chip-status${planActive ? " fz-chip-status--ok" : ""}`}><span aria-hidden="true" />{subscriptionStatusLabel(plan.status)}</span>
                </>
              ) : (
                <>
                  <h2 id="plan-title" className="fz-acard__title">Todavía no tienes Plan de Pan</h2>
                  <p className="fz-acard__text">Elige tus panes y tu ritmo, y nosotros los reservamos por ti.</p>
                </>
              )}
            </div>
            <div className="fz-acard__photo fz-acard__photo--square">
              <Image src={plan?.imagePath ? `/api/product-images/${plan.imagePath}` : "/bolsa-fuerza.png"} alt="" fill sizes="(min-width: 48rem) 180px, 110px" />
            </div>
          </div>
          <Link className="fz-acard__link" href={plan ? `/cuenta/plan-de-pan/${plan.id}` : "/plan-de-pan"}>
            {plan ? "Ver y gestionar mi plan" : "Crear mi Plan de Pan"}<ArrowRightIcon />
          </Link>
        </section>

        <section className="fz-acard" aria-labelledby="orders-title">
          <div className="fz-acard__row">
            <span className="fz-acard__icon" aria-hidden="true"><PackageIcon /></span>
            <div className="fz-acard__body">
              <p className="fz-acard__eyebrow">Pedidos recientes</p>
              {recent.length ? (
                <>
                  <h2 id="orders-title" className="fz-acard__title">{orders.length} {orders.length === 1 ? "pedido" : "pedidos"}</h2>
                  <ul className="fz-acard__mini-list">
                    {recent.map((order) => (
                      <li key={order.id}>
                        <span>{formatDateEs(order.collectionDate)}</span>
                        <span>{orderStatusLabel(order.status)} · {formatPrice(order.totalCents)}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <h2 id="orders-title" className="fz-acard__title">Todavía no hay pedidos</h2>
                  <p className="fz-acard__text">Tus pedidos confirmados aparecerán aquí.</p>
                </>
              )}
            </div>
          </div>
          <Link className="fz-acard__link" href="/cuenta/pedidos">Ver historial de pedidos<ArrowRightIcon /></Link>
        </section>

        <section className="fz-acard" aria-labelledby="me-title">
          <p className="fz-acard__eyebrow" id="me-title">Mi cuenta</p>
          <div className="fz-acard__me">
            <span className="fz-avatar" aria-hidden="true">{account.initials}</span>
            <span className="fz-acard__me-text">
              <strong>{account.fullName || "Sin nombre"}</strong>
              <span>{account.email}</span>
            </span>
            <Link className="fz-acard__link fz-acard__link--inline" href="/cuenta/perfil">Editar perfil<ArrowRightIcon /></Link>
          </div>
        </section>

        <form action={signOutAction} className="fz-account__signout">
          <button type="submit" className="fz-btn-secondary">Cerrar sesión</button>
        </form>
      </div>
    </main>
  );
}
