"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, EmptyState, Input, Select } from "@/components/ui";
import { TrashIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/catalog-domain";
import { formatTime, isoWeekday } from "@/lib/order-cutoff";
import { PICKUP_DATE_COOKIE, PICKUP_POINT_COOKIE } from "@/lib/pickup-selection";

import { useCart } from "./cart-provider";

function setCookie(name: string, value: string) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=15552000; SameSite=Lax${secure}`;
}

type PickupPoint = { id: string; name: string; collectionWindows: { weekday: number; startsAt: string | null; endsAt: string | null }[] };

export function CartPageClient({
  points,
  initialPoint,
  initialDate,
  minDate,
}: {
  points: PickupPoint[];
  initialPoint: string;
  initialDate: string;
  minDate: string;
}) {
  const cart = useCart();
  const router = useRouter();
  const [point, setPoint] = useState(initialPoint);
  const [date, setDate] = useState(initialDate);
  const selectedPoint = points.find((p) => p.id === point);
  const activeWindow = selectedPoint?.collectionWindows.find((w) => w.weekday === isoWeekday(date));
  const pickupTimeHelp = activeWindow?.startsAt && activeWindow.endsAt
    ? `Recogida de ${formatTime(activeWindow.startsAt)} a ${formatTime(activeWindow.endsAt)}. Pedidos con un mínimo de 48 horas de antelación.`
    : selectedPoint
      ? "Este punto no recoge pedidos ese día. Elige otra fecha para ver la franja horaria."
      : "Selecciona un punto de recogida para ver la franja horaria.";

  if (!cart.items.length) {
    return <EmptyState title="Tu cesta está vacía" description="Añade un pan publicado antes de continuar." action={<Link href="/reserva-y-recoge">Ver el catálogo</Link>} />;
  }

  return (
    <div className="checkout-grid">
      <div>
        {cart.items.map((item) => (
          <article key={item.variantId} className="cart-row">
            <div className="cart-row__header">
              {item.image ? (
                <Image className="cart-row__thumb" src={`/api/product-images/${item.image}`} alt="" width={64} height={64} />
              ) : (
                <span className="cart-row__thumb cart-row__thumb--placeholder" aria-hidden="true" />
              )}
              <div>
                <h2>{item.productName}</h2>
                <p>{item.variantName}</p>
              </div>
            </div>
            {item.note ? <p className="cart-row__note">&ldquo;{item.note}&rdquo;</p> : null}
            <div className="cart-row__quantity">
              <div className="stepper">
                <button type="button" className="stepper__button" aria-label="Quitar una unidad" onClick={() => cart.setQuantity(item.variantId, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                <span className="stepper__value" aria-live="polite">{item.quantity}</span>
                <button type="button" className="stepper__button" aria-label="Añadir una unidad" onClick={() => cart.setQuantity(item.variantId, Math.min(99, item.quantity + 1))}>+</button>
              </div>
              <Button variant="icon" aria-label={`Eliminar ${item.productName} de la cesta`} onClick={() => cart.remove(item.variantId)}>
                <TrashIcon />
              </Button>
            </div>
            <p className="cart-row__price">{formatPrice(item.priceCents)} × {item.quantity} = <strong>{formatPrice(item.priceCents * item.quantity)}</strong></p>
          </article>
        ))}
      </div>
      <aside>
        <p className="cart-summary-total"><span>Total estimado</span><strong>{formatPrice(cart.total)}</strong></p>
        <Select
          id="pickup"
          label="Punto de recogida"
          value={point}
          onChange={(e) => { setPoint(e.target.value); setCookie(PICKUP_POINT_COOKIE, e.target.value); }}
          required
        >
          <option value="">Selecciona</option>
          {points.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Input
          id="date"
          label="Fecha de recogida"
          type="date"
          min={minDate}
          value={date}
          onChange={(e) => { if (!e.target.value) return; setDate(e.target.value); setCookie(PICKUP_DATE_COOKIE, e.target.value); }}
          helpText={pickupTimeHelp}
          required
        />
        <p>Todos los artículos se recogerán en el mismo punto y fecha. El precio final y la disponibilidad se confirman en el pago.</p>
        <Button disabled={!point || !date} onClick={() => { const pointName = points.find((p) => p.id === point)?.name ?? ""; sessionStorage.setItem("fuerza-checkout", JSON.stringify({ point, pointName, date, key: crypto.randomUUID() })); router.push("/checkout"); }}>
          Continuar al pago
        </Button>
      </aside>
    </div>
  );
}
