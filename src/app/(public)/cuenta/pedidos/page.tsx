import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { ArrowRightIcon, CalendarIcon, ChevronRightIcon, ClockIcon, RepeatIcon, WheatIcon } from "@/components/ui/icons";
import { loadAccountOrders, loadAccountPlan, requireAccount, upcomingOrders } from "@/lib/account";
import { formatDateEs, formatTime } from "@/lib/order-cutoff";
import { ORDER_STATUS_BADGE_VARIANT, orderStatusLabel } from "@/lib/order-status-domain";
import { createPageMetadata } from "@/lib/seo";
import { FREQUENCY_LABELS_ES, PLAN_TITLE_ES, WEEKDAY_NAMES_ES, subscriptionStatusLabel } from "@/lib/subscriptions-domain";

export const metadata: Metadata = createPageMetadata({ title: "Tus pedidos", description: "Tu próxima recogida, tu Plan de Pan y tu historial de pedidos.", path: "/cuenta/pedidos" });

const RECENT_LIMIT = 5;
const joinEs = (parts: string[]) => (parts.length <= 1 ? parts.join("") : `${parts.slice(0, -1).join(", ")} y ${parts.at(-1)}`);

function dateParts(iso: string) {
  const date = new Date(`${iso}T00:00:00Z`);
  const part = (options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("es-ES", { ...options, timeZone: "UTC" }).format(date).replace(".", "");
  return { weekday: part({ weekday: "short" }), day: part({ day: "numeric" }), month: part({ month: "short" }) };
}

/** "Jue, 17 de abril" */
function shortDate(iso: string) {
  const { weekday } = dateParts(iso);
  const long = new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
  return `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)}, ${long}`;
}

export default async function AccountOrdersPage({ searchParams }: { searchParams: Promise<{ todos?: string }> }) {
  const [account, { todos }] = await Promise.all([requireAccount("/cuenta/pedidos"), searchParams]);
  const [orders, plan] = await Promise.all([loadAccountOrders(account.userId), loadAccountPlan(account.userId)]);
  const upcoming = upcomingOrders(orders);
  const next = upcoming[0];
  const others = upcoming.slice(1);
  const showAll = todos === "1";
  const history = orders.filter((o) => !upcoming.includes(o));
  const shown = showAll ? history : history.slice(0, RECENT_LIMIT);
  const planUnits = plan?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  return (
    <main id="main-content" className="fz-account">
      <div className="fz-container fz-account__container">
        <header className="fz-account__intro">
          <Breadcrumbs items={[{ label: "Mi FUERZA", href: "/cuenta" }, { label: "Pedidos" }]} />
          <h1 className="fz-display">Tus pedidos y tu Plan de Pan</h1>
          <p>Tu próxima recogida, tu plan y todo tu historial en un mismo sitio.</p>
        </header>

        <h2 className="fz-account__label">Próxima recogida</h2>
        {next ? (
          <section className="fz-acard" aria-label="Próxima recogida">
            <div className="fz-next">
              <p className="fz-next__date" aria-hidden="true">
                <span>{dateParts(next.collectionDate).weekday}</span>
                <strong>{dateParts(next.collectionDate).day}</strong>
                <span>{dateParts(next.collectionDate).month}</span>
              </p>
              <div className="fz-next__body">
                <span className={`fz-chip-status${next.status === "ready" ? " fz-chip-status--ok" : " fz-chip-status--info"}`}><span aria-hidden="true" />{orderStatusLabel(next.status)}</span>
                <h3 className="fz-acard__title">{next.status === "ready" ? "Tu pan está listo" : "Tu pan te espera"}</h3>
                <p className="fz-acard__line"><CalendarIcon aria-hidden="true" />{formatDateEs(next.collectionDate)}</p>
                {next.window ? <p className="fz-acard__line"><ClockIcon aria-hidden="true" />De {formatTime(next.window.startsAt)} a {formatTime(next.window.endsAt)}</p> : null}
                {next.pointName ? <p className="fz-acard__line fz-acard__line--muted">{next.pointName}</p> : null}
              </div>
            </div>
            <Link className="fz-btn fz-btn--block" href={`/cuenta/pedidos/${next.id}`}>Ver detalles del pedido<ArrowRightIcon /></Link>
          </section>
        ) : (
          <p className="fz-account__empty">No tienes ninguna recogida próxima. <Link href="/reserva-y-recoge">Reservar pan</Link></p>
        )}

        <h2 className="fz-account__label">Tu Plan de Pan</h2>
        {plan ? (
          <section className="fz-acard" aria-label="Tu Plan de Pan">
            <div className="fz-plan-card">
              <div className="fz-plan-card__photo">
                <Image src={plan.imagePath ? `/api/product-images/${plan.imagePath}` : "/bolsa-fuerza.png"} alt="" fill sizes="140px" />
              </div>
              <div>
                <span className={`fz-chip-status fz-chip-status--plan${["active", "trialing"].includes(plan.status) ? "" : " fz-chip-status--muted"}`}>
                  {["active", "trialing"].includes(plan.status) ? "Plan activo" : subscriptionStatusLabel(plan.status)}
                </span>
                <h3 className="fz-acard__title">{PLAN_TITLE_ES[plan.frequency] ?? "Plan de Pan"}</h3>
                <p className="fz-acard__text">{FREQUENCY_LABELS_ES[plan.frequency]}{plan.weekdays.length ? ` · ${joinEs(plan.weekdays.map((d) => WEEKDAY_NAMES_ES[d - 1]))}` : ""} · {planUnits} {planUnits === 1 ? "pan" : "panes"}</p>
              </div>
            </div>
            <dl className="fz-plan-stats">
              <div><RepeatIcon aria-hidden="true" /><dt>Frecuencia</dt><dd>{FREQUENCY_LABELS_ES[plan.frequency]}</dd></div>
              <div><WheatIcon aria-hidden="true" /><dt>Tus panes</dt><dd>{joinEs(plan.items.map((i) => (i.quantity > 1 ? `${i.name} ×${i.quantity}` : i.name)))}</dd></div>
              <div><CalendarIcon aria-hidden="true" /><dt>Próxima recogida</dt><dd>{plan.nextCollectionDate ? shortDate(plan.nextCollectionDate) : "Pendiente"}</dd></div>
            </dl>
            <Link className="fz-btn-outline" href={`/cuenta/plan-de-pan/${plan.id}`}>Gestionar plan<ArrowRightIcon /></Link>
          </section>
        ) : (
          <p className="fz-account__empty">Todavía no tienes Plan de Pan. <Link href="/plan-de-pan">Crear mi Plan de Pan</Link></p>
        )}

        <div className="fz-account__label-row">
          <h2 className="fz-account__label">Pedidos recientes</h2>
          {!showAll && history.length > RECENT_LIMIT ? <Link className="fz-link" href="/cuenta/pedidos?todos=1">Ver todo<ChevronRightIcon /></Link> : null}
        </div>
        {shown.length ? (
          <ul className="fz-order-list">
            {shown.map((order) => (
              <li key={order.id}>
                <Link className="fz-order-row" href={`/cuenta/pedidos/${order.id}`}>
                  <span className="fz-order-row__thumb">
                    {order.imagePath ? <Image src={`/api/product-images/${order.imagePath}`} alt="" fill sizes="64px" /> : null}
                  </span>
                  <span className="fz-order-row__text">
                    <strong>{shortDate(order.collectionDate)}</strong>
                    <span>{joinEs(order.items.map((i) => i.name)) || order.publicCode}</span>
                  </span>
                  <span className={`fz-chip-status fz-chip-status--small${ORDER_STATUS_BADGE_VARIANT[order.status] === "success" ? " fz-chip-status--ok" : ""}`}><span aria-hidden="true" />{orderStatusLabel(order.status)}</span>
                  <ChevronRightIcon className="fz-order-row__chevron" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="fz-account__empty">Todavía no hay pedidos. Tus pedidos confirmados aparecerán aquí.</p>
        )}

        <h2 className="fz-account__label">Otras recogidas</h2>
        {others.length ? (
          <ul className="fz-order-list">
            {others.map((order) => (
              <li key={order.id}>
                <Link className="fz-order-row" href={`/cuenta/pedidos/${order.id}`}>
                  <span className="fz-order-row__thumb">
                    {order.imagePath ? <Image src={`/api/product-images/${order.imagePath}`} alt="" fill sizes="64px" /> : null}
                  </span>
                  <span className="fz-order-row__text">
                    <strong>{shortDate(order.collectionDate)}</strong>
                    <span>{joinEs(order.items.map((i) => i.name)) || order.publicCode}</span>
                  </span>
                  <span className="fz-chip-status fz-chip-status--small fz-chip-status--info"><span aria-hidden="true" />{orderStatusLabel(order.status)}</span>
                  <ChevronRightIcon className="fz-order-row__chevron" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="fz-dashed">
            <WheatIcon aria-hidden="true" />
            <p><strong>No tienes ninguna recogida adicional</strong>Cuando reserves pan, aparecerá aquí.</p>
          </div>
        )}
      </div>
    </main>
  );
}
