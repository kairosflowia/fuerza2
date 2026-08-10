"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Image from "next/image";
import { useMemo, useState } from "react";

import { Alert, Badge, Button, Card, Select } from "@/components/ui";
import { formatPrice } from "@/lib/catalog-domain";
import {
  basketDiscountPercent,
  FREQUENCY_DESCRIPTIONS_ES,
  FREQUENCY_LABELS_ES,
  SUBSCRIPTION_DISCOUNT_PERCENT,
  SUBSCRIPTION_DISCOUNT_THRESHOLD_UNITS,
  type SubscriptionFrequency,
} from "@/lib/subscriptions-domain";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;

const FREQUENCIES: SubscriptionFrequency[] = ["weekly", "biweekly", "every_3_weeks", "monthly"];
const WEEKDAY_LABELS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

type VariantOption = { id: string; name: string; priceCents: number; imagePath: string | null };
type PickupPoint = { id: string; name: string };

function SubscriptionPayment({ subscriptionId }: { subscriptionId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <Card className="membership-payment-card">
      <p className="membership-step__label">Último paso</p>
      <h2>Añade tu método de pago</h2>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!stripe || !elements) return;
          setBusy(true);
          const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${location.origin}/plan-de-pan/confirmacion?subscription=${subscriptionId}` } });
          if (result.error) {
            setError(result.error.message ?? "No se pudo completar el pago.");
            setBusy(false);
          }
        }}
      >
        <PaymentElement />
        <p className="membership-summary__note">El primer pago y los siguientes se gestionan de forma segura con Stripe.</p>
        <Button type="submit" loading={busy} disabled={!stripe} fullWidth>Activar Fuerza Habitual</Button>
        {error ? <Alert variant="error" title="No se ha podido pagar">{error}</Alert> : null}
      </form>
    </Card>
  );
}

export function BasketConfigurator({ variants, pickupPoints }: { variants: VariantOption[]; pickupPoints: PickupPoint[] }) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [frequency, setFrequency] = useState<SubscriptionFrequency>("weekly");
  const [pickupPointId, setPickupPointId] = useState("");
  const [weekday, setWeekday] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<{ clientSecret: string; subscriptionId: string } | null>(null);

  const items = useMemo(
    () => variants.map((v) => ({ ...v, quantity: quantities[v.id] ?? 0 })).filter((v) => v.quantity > 0),
    [variants, quantities],
  );
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0);
  const discountPercent = basketDiscountPercent(totalQuantity);
  const total = Math.round(subtotal * (1 - discountPercent / 100));
  const missingForDiscount = Math.max(0, SUBSCRIPTION_DISCOUNT_THRESHOLD_UNITS - totalQuantity);
  const canSubmit = items.length > 0 && Boolean(pickupPointId) && Boolean(weekday) && !busy;

  function setQty(id: string, quantity: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(0, Math.min(20, quantity)) }));
  }

  async function submit() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/subscriptions/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ variant_id: i.id, quantity: i.quantity })),
        pickupPointId,
        weekday: Number(weekday),
        frequency,
      }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok || !data.clientSecret) {
      setMessage(response.status === 503 ? "El pago recurrente todavía no está disponible." : "No hay capacidad compatible con esta cesta. Prueba con otra cantidad, punto o día.");
      return;
    }
    setPayment({ clientSecret: data.clientSecret, subscriptionId: data.subscriptionId });
  }

  if (payment) {
    if (!stripePromise) return <Alert variant="warning" title="Pago no disponible">El pago recurrente todavía no está configurado.</Alert>;
    return (
      <Elements stripe={stripePromise} options={{ clientSecret: payment.clientSecret, appearance: { theme: "flat" } }}>
        <SubscriptionPayment subscriptionId={payment.subscriptionId} />
      </Elements>
    );
  }

  if (!variants.length) {
    return <Alert variant="warning" title="Sin panes disponibles en membresía">Todavía no hay ningún pan publicado para Fuerza Habitual. Vuelve pronto.</Alert>;
  }

  return (
    <div className="membership-builder">
      <div className="membership-builder__main">
        <section className="membership-step">
          <p className="membership-step__label">Paso 1</p>
          <h2>Elige tu pan</h2>
          <div className="membership-bread-grid">
            {variants.map((v) => {
              const qty = quantities[v.id] ?? 0;
              return (
                <article key={v.id} className="membership-bread-card" data-selected={qty > 0 || undefined}>
                  <div className="membership-bread-card__media">
                    {v.imagePath ? (
                      <Image src={`/api/product-images/${v.imagePath}`} alt="" width={320} height={320} />
                    ) : (
                      <div className="catalog-image-empty" aria-hidden="true" />
                    )}
                  </div>
                  <div className="membership-bread-card__body">
                    <p className="membership-bread-card__name">{v.name}</p>
                    <p className="membership-bread-card__price">{formatPrice(v.priceCents)}</p>
                    <div className="stepper stepper--compact">
                      <button type="button" className="stepper__button" aria-label={`Quitar ${v.name}`} onClick={() => setQty(v.id, qty - 1)} disabled={qty <= 0}>−</button>
                      <span className="stepper__value" aria-live="polite">{qty}</span>
                      <button type="button" className="stepper__button" aria-label={`Añadir ${v.name}`} onClick={() => setQty(v.id, qty + 1)}>+</button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="membership-step">
          <p className="membership-step__label">Paso 2</p>
          <h2>Elige tu frecuencia</h2>
          <div className="membership-frequency-grid">
            {FREQUENCIES.map((f) => (
              <button
                key={f}
                type="button"
                className="membership-frequency-card"
                aria-pressed={frequency === f}
                onClick={() => setFrequency(f)}
              >
                <span className="membership-frequency-card__name">{FREQUENCY_LABELS_ES[f]}</span>
                <span className="membership-frequency-card__desc">{FREQUENCY_DESCRIPTIONS_ES[f]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="membership-step">
          <p className="membership-step__label">Paso 3</p>
          <h2>Dónde y cuándo recoges</h2>
          <div className="component-row">
            <Select id="basket-point" label="Punto de recogida" value={pickupPointId} onChange={(e) => setPickupPointId(e.target.value)} required>
              <option value="">Selecciona</option>
              {pickupPoints.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <Select id="basket-weekday" label="Día habitual" value={weekday} onChange={(e) => setWeekday(e.target.value)} required>
              <option value="">Selecciona</option>
              {WEEKDAY_LABELS.map((label, i) => (
                <option key={label} value={i + 1}>{label}</option>
              ))}
            </Select>
          </div>
        </section>
      </div>

      <aside className="membership-summary">
        <div className="membership-summary__card">
          <p className="membership-summary__heading">Tu membresía</p>
          {items.length ? (
            <ul className="membership-summary__items">
              {items.map((i) => (
                <li key={i.id}>
                  <span>{i.quantity} × {i.name}</span>
                  <span>{formatPrice(i.priceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="membership-summary__empty">Todavía no has elegido ningún pan.</p>
          )}

          {totalQuantity > 0 ? (
            <div className="membership-discount">
              {discountPercent > 0 ? (
                <Badge variant="success">{SUBSCRIPTION_DISCOUNT_PERCENT}% de descuento aplicado</Badge>
              ) : (
                <p className="membership-discount__hint">
                  Añade {missingForDiscount} unidad{missingForDiscount === 1 ? "" : "es"} más para el {SUBSCRIPTION_DISCOUNT_PERCENT}% de descuento
                </p>
              )}
              <div className="membership-discount__bar"><span style={{ width: `${Math.min(100, (totalQuantity / SUBSCRIPTION_DISCOUNT_THRESHOLD_UNITS) * 100)}%` }} /></div>
            </div>
          ) : null}

          <p className="membership-summary__total">
            <span>Total por ciclo</span>
            <span>{formatPrice(total)}</span>
          </p>

          <Button type="button" loading={busy} disabled={!canSubmit} onClick={submit} fullWidth>
            Continuar con Stripe
          </Button>
          {message ? <Alert variant="error" title="No se ha podido continuar">{message}</Alert> : null}
          <p className="membership-summary__note">Comprobaremos la capacidad antes de crear la suscripción.</p>
        </div>
      </aside>
    </div>
  );
}
