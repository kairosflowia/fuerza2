"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { Alert, Button, Checkbox, EmptyState, Input, Select } from "@/components/ui";
import { TrashIcon } from "@/components/ui/icons";
import { availabilityReasonLabel } from "@/lib/availability-domain";
import { formatPrice } from "@/lib/catalog-domain";
import { formatDateEs, formatTime, isoWeekday } from "@/lib/order-cutoff";
import { PICKUP_DATE_COOKIE, PICKUP_POINT_COOKIE } from "@/lib/pickup-selection";

import { useCart } from "./cart-provider";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;
const appearance = {
  theme: "stripe" as const,
  variables: { colorPrimary: "#e4572e", colorText: "#171412", borderRadius: "10px", fontFamily: "inherit" },
};

function setCookie(name: string, value: string) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=15552000; SameSite=Lax${secure}`;
}

type PickupPoint = { id: string; name: string; collectionWindows: { weekday: number; startsAt: string | null; endsAt: string | null }[] };
type Payment = { secret: string; code: string; token: string; expiresAt: string | null };

/** Minutos restantes antes de que expire la reserva de estoque (15 min desde que se creó el pedido). Si ya expiró, un pago que llegue igualmente se revisa a mano en vez de perderse (Fase 4). */
function useMinutesLeft(expiresAt: string | null) {
  const [minutesLeft, setMinutesLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!expiresAt) return;
    const target = new Date(expiresAt).getTime();
    const tick = () => setMinutesLeft(Math.max(0, Math.ceil((target - Date.now()) / 60000)));
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, [expiresAt]);
  return minutesLeft;
}

function PayForm({ code, token, expiresAt }: { code: string; token: string; expiresAt: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const minutesLeft = useMinutesLeft(expiresAt);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!stripe || !elements || busy) return;
        setBusy(true);
        setError("");
        try {
          const { error: confirmError } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: `${location.origin}/checkout/pago?pedido=${code}&token=${encodeURIComponent(token)}` },
          });
          if (confirmError) setError(confirmError.message ?? "No se pudo completar el pago.");
        } catch (err) {
          console.error("checkout confirmPayment failed", err);
          setError("Ha ocurrido un error inesperado. Inténtalo de nuevo.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <PaymentElement />
      <Button type="submit" fullWidth loading={busy} loadingLabel="Procesando…" disabled={!stripe}>Pagar ahora</Button>
      <p className="field__help">No se paga en el punto de recogida.</p>
      {minutesLeft !== null && minutesLeft > 0 ? (
        <p className="field__help">Te reservamos el pan durante {minutesLeft} min. Si tarda más, no te preocupes: revisamos el pago a mano en cuanto llegue.</p>
      ) : null}
      {error ? <Alert variant="error" title="No se ha podido pagar">{error}</Alert> : null}
    </form>
  );
}

export function CartPageClient({
  points,
  initialPoint,
  initialDate,
  minDate,
  initialName = "",
  initialEmail = "",
  initialPhone = "",
}: {
  points: PickupPoint[];
  initialPoint: string;
  initialDate: string;
  minDate: string;
  initialName?: string;
  initialEmail?: string;
  initialPhone?: string;
}) {
  const cart = useCart();
  const [point, setPoint] = useState(initialPoint);
  const [date, setDate] = useState(initialDate);
  const [showEmail, setShowEmail] = useState(Boolean(initialEmail));
  const [payment, setPayment] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const selectedPoint = points.find((p) => p.id === point);
  const activeWindow = selectedPoint?.collectionWindows.find((w) => w.weekday === isoWeekday(date));
  const pickupTimeText = activeWindow?.startsAt && activeWindow.endsAt ? `${formatTime(activeWindow.startsAt)}–${formatTime(activeWindow.endsAt)}` : null;
  const pickupHelp = pickupTimeText
    ? `Recogida de ${pickupTimeText}. Pedidos con un mínimo de 48 horas de antelación.`
    : selectedPoint
      ? "Este punto no recoge pedidos ese día. Elige otra fecha para ver la franja horaria."
      : "Selecciona un punto de recogida para ver la franja horaria.";

  if (!cart.items.length) {
    return <EmptyState title="Tu cesta está vacía" description="Añade un pan publicado antes de continuar." action={<Link href="/reserva-y-recoge">Ver el catálogo</Link>} />;
  }
  if (!stripePromise) {
    return <Alert variant="error" title="Pago no disponible">El pago todavía no está configurado.</Alert>;
  }

  async function submitOrder(form: HTMLFormElement) {
    if (!point || !date || busy) return;
    setBusy(true);
    setError("");
    try {
      const f = new FormData(form);
      const sessionKey = crypto.randomUUID();
      const response = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
          pickupPointId: point,
          collectionDate: date,
          sessionKey,
          name: f.get("name"),
          email: showEmail ? f.get("email") : "",
          phone: f.get("phone"),
          terms: f.get("consent") === "on",
          privacy: f.get("consent") === "on",
          marketing: f.get("marketing") === "on",
        }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.clientSecret) {
        setError(data?.error ? availabilityReasonLabel(data.error) : "No hemos podido reservar la disponibilidad. Inténtalo de nuevo.");
        return;
      }
      setPayment({ secret: data.clientSecret, code: data.publicCode, token: data.lookupToken, expiresAt: data.expiresAt ?? null });
    } catch (err) {
      console.error("checkout create failed", err);
      setError("Ha ocurrido un error inesperado. Inténtalo de nuevo.");
    } finally {
      setBusy(false);
    }
  }

  const pickupRecap = selectedPoint ? (
    <p className="checkout-summary__pickup">
      Recogida en {selectedPoint.name}, <strong>{formatDateEs(date)}{pickupTimeText ? ` · ${pickupTimeText}` : ""}</strong>
    </p>
  ) : null;

  return (
    <div className="checkout-grid">
      <div>
        {payment ? (
          <ul className="checkout-summary__items">
            {cart.items.map((item) => (
              <li key={item.variantId}>
                <span>{item.quantity} × {item.productName} {item.variantName ? `— ${item.variantName}` : ""}</span>
                <span>{formatPrice(item.priceCents * item.quantity)}</span>
              </li>
            ))}
          </ul>
        ) : (
          cart.items.map((item) => (
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
          ))
        )}
      </div>

      <aside className="checkout-payment-panel">
        <p className="cart-summary-total"><span>Total a pagar</span><strong>{formatPrice(cart.total)}</strong></p>

        {payment ? (
          <>
            {pickupRecap}
            <Elements stripe={stripePromise} options={{ clientSecret: payment.secret, appearance }}>
              <PayForm code={payment.code} token={payment.token} expiresAt={payment.expiresAt} />
            </Elements>
          </>
        ) : (
          <form
            className="checkout-form"
            onSubmit={(e) => {
              e.preventDefault();
              submitOrder(e.currentTarget);
            }}
          >
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
              helpText={pickupHelp}
              required
            />
            {pickupTimeText ? pickupRecap : null}

            <div className="checkout-contact-fields">
              <p className="checkout-contact-fields__label">¿Quién recoge el pedido?</p>
              <div className="checkout-contact-fields__row">
                <Input id="checkout-name" name="name" label="Nombre" defaultValue={initialName} required />
                <Input id="checkout-phone" name="phone" label="Teléfono" type="tel" defaultValue={initialPhone} required />
              </div>
              {showEmail ? (
                <Input id="checkout-email" name="email" label="Correo (para el recibo)" type="email" defaultValue={initialEmail} optional />
              ) : (
                <Button type="button" variant="text" onClick={() => setShowEmail(true)}>+ Añadir correo para recibo (opcional)</Button>
              )}
            </div>

            <Checkbox
              id="consent"
              name="consent"
              required
              label={<>Acepto las <a href="/condiciones-de-compra" target="_blank" rel="noreferrer">condiciones de compra</a> y la <a href="/privacidad" target="_blank" rel="noreferrer">política de privacidad</a>.</>}
            />
            <Checkbox id="marketing" name="marketing" label="Quiero recibir novedades de FUERZA." />

            <Button type="submit" fullWidth loading={busy} loadingLabel="Reservando…" disabled={!point || !date}>Pagar</Button>
            {error ? <Alert variant="error" title="No se ha podido continuar">{error}</Alert> : null}
          </form>
        )}
      </aside>
    </div>
  );
}
