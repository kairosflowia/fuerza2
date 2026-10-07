import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RepeatOrderButton } from "@/components/account/repeat-order-button";
import { Breadcrumbs } from "@/components/public/breadcrumbs";
import { CalendarIcon, ClockIcon, PinIcon } from "@/components/ui/icons";
import { loadAccountOrders, requireAccount } from "@/lib/account";
import { formatPrice } from "@/lib/catalog-domain";
import { formatDateEs, formatTime } from "@/lib/order-cutoff";
import { orderStatusLabel } from "@/lib/order-status-domain";

export const metadata: Metadata = { title: "Detalle del pedido", robots: { index: false, follow: false } };

export default async function AccountOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const account = await requireAccount(`/cuenta/pedidos/${id}`);
  // RLS + filtro por cliente: solo se encuentran los pedidos propios.
  const [order] = await loadAccountOrders(account.userId, { orderId: id });
  if (!order) notFound();

  return (
    <main id="main-content" className="fz-account">
      <div className="fz-container fz-account__container">
        <header className="fz-account__intro">
          <Breadcrumbs items={[{ label: "Mi FUERZA", href: "/cuenta" }, { label: "Pedidos", href: "/cuenta/pedidos" }, { label: order.publicCode }]} />
          <p className="fz-eyebrow fz-eyebrow--muted">Pedido {order.publicCode}</p>
          <h1 className="fz-display">{formatDateEs(order.collectionDate)}</h1>
          <span className={`fz-chip-status${["ready", "collected"].includes(order.status) ? " fz-chip-status--ok" : " fz-chip-status--info"}`}><span aria-hidden="true" />{orderStatusLabel(order.status)}</span>
        </header>

        <section className="fz-acard" aria-label="Recogida">
          <p className="fz-acard__line"><CalendarIcon aria-hidden="true" />{formatDateEs(order.collectionDate)}</p>
          {order.window ? <p className="fz-acard__line"><ClockIcon aria-hidden="true" />De {formatTime(order.window.startsAt)} a {formatTime(order.window.endsAt)}</p> : null}
          {order.pointName ? (
            <p className="fz-acard__line"><PinIcon aria-hidden="true" /><span><strong>{order.pointName}</strong>{order.pointAddress ? ` · ${order.pointAddress}` : ""}</span></p>
          ) : null}
        </section>

        <section className="fz-acard" aria-labelledby="items-title">
          <h2 id="items-title" className="fz-acard__eyebrow">Tu pedido</h2>
          <ul className="fz-order-items">
            {order.items.map((item, index) => (
              <li key={`${item.name}-${index}`}>
                <span>{item.quantity} × {item.name}{item.variantName && item.variantName !== "Única" ? ` · ${item.variantName}` : ""}</span>
                <span>{formatPrice(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>
          <p className="fz-order-items__total"><span>Total</span><strong>{formatPrice(order.totalCents)}</strong></p>
          {order.repeatItems.length ? <RepeatOrderButton items={order.repeatItems} /> : null}
        </section>

        <Link className="fz-link" href="/cuenta/pedidos">Volver a mis pedidos</Link>
      </div>
    </main>
  );
}
