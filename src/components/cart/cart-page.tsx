"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button, EmptyState, Input, Select } from "@/components/ui";
import { TrashIcon } from "@/components/ui/icons";
import { formatPrice } from "@/lib/catalog-domain";

import { useCart } from "./cart-provider";

// Regla operativa: recogida 10:00-14:30, pedidos con 48h de antelación
// mínima (availability.cutoff_time / cutoff_days_before en app_settings).
// Si todavía no son las 10:00 de hoy, el primer día válido es hoy+2; si ya
// pasaron las 10:00, el corte de hoy ya se cerró y el primer día válido es
// hoy+3. El servidor (create_checkout_order) sigue siendo quien de verdad
// impone la regla -- esto es solo para no dejar elegir en el date picker
// una fecha que el pago rechazaría después.
function minCollectionDate() {
  const now = new Date();
  const daysAhead = now.getHours() < 10 ? 2 : 3;
  const min = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysAhead);
  return min.toISOString().slice(0, 10);
}

export function CartPageClient({ points }: { points: { id: string; name: string }[] }) {
  const cart = useCart();
  const router = useRouter();
  const defaultPoint = points.find((p) => p.name === "Obrador FUERZA")?.id ?? points[0]?.id ?? "";
  const [point, setPoint] = useState(defaultPoint);
  const [date, setDate] = useState(minCollectionDate);

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
        <Select id="pickup" label="Punto de recogida" value={point} onChange={(e) => setPoint(e.target.value)} required>
          <option value="">Selecciona</option>
          {points.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Input id="date" label="Fecha de recogida" type="date" min={minCollectionDate()} value={date} onChange={(e) => setDate(e.target.value)} helpText="Recogida de 10:00 a 14:30. Pedidos con un mínimo de 48 horas de antelación." required />
        <p>Todos los artículos se recogerán en el mismo punto y fecha. El precio final y la disponibilidad se confirman en el pago.</p>
        <Button disabled={!point || !date} onClick={() => { const pointName = points.find((p) => p.id === point)?.name ?? ""; sessionStorage.setItem("fuerza-checkout", JSON.stringify({ point, pointName, date, key: crypto.randomUUID() })); router.push("/checkout"); }}>
          Continuar al pago
        </Button>
      </aside>
    </div>
  );
}
