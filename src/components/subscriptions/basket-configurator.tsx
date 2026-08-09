"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

import { Alert, Button, Select } from "@/components/ui";
import { Input } from "@/components/ui/fields";
import { formatPrice } from "@/lib/catalog-domain";
import { basketDiscountPercent, FREQUENCY_LABELS_ES, type SubscriptionFrequency } from "@/lib/subscriptions-domain";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;

const FREQUENCIES: SubscriptionFrequency[] = ["weekly", "biweekly", "every_3_weeks", "monthly"];
const WEEKDAY_LABELS = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];

type VariantOption = { id: string; label: string; priceCents: number };
type PickupPoint = { id: string; name: string };
type Row = { key: number; variantId: string; quantity: number };

function SubscriptionPayment({ subscriptionId }: { subscriptionId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
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
      <p>El primer pago y los siguientes se gestionan de forma segura con Stripe.</p>
      <Button type="submit" loading={busy} disabled={!stripe}>Activar Fuerza Habitual</Button>
      {error ? <Alert variant="error" title="No se ha podido pagar">{error}</Alert> : null}
    </form>
  );
}

export function BasketConfigurator({ variants, pickupPoints }: { variants: VariantOption[]; pickupPoints: PickupPoint[] }) {
  const [rows, setRows] = useState<Row[]>([{ key: 0, variantId: variants[0]?.id ?? "", quantity: 1 }]);
  const [frequency, setFrequency] = useState<SubscriptionFrequency>("weekly");
  const [pickupPointId, setPickupPointId] = useState("");
  const [weekday, setWeekday] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<{ clientSecret: string; subscriptionId: string } | null>(null);
  const nextKey = rows.length ? Math.max(...rows.map((r) => r.key)) + 1 : 0;

  const totalQuantity = rows.reduce((sum, row) => sum + (row.variantId ? row.quantity : 0), 0);
  const subtotal = rows.reduce((sum, row) => {
    const variant = variants.find((v) => v.id === row.variantId);
    return sum + (variant ? variant.priceCents * row.quantity : 0);
  }, 0);
  const discountPercent = basketDiscountPercent(totalQuantity);
  const total = Math.round(subtotal * (1 - discountPercent / 100));

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
    <form
      className="admin-form"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        const items = rows.filter((r) => r.variantId && r.quantity > 0).map((r) => ({ variant_id: r.variantId, quantity: r.quantity }));
        const response = await fetch("/api/subscriptions/create", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items, pickupPointId, weekday: Number(weekday), frequency }),
        });
        const data = await response.json();
        setBusy(false);
        if (!response.ok || !data.clientSecret) {
          setMessage(response.status === 503 ? "El pago recurrente todavía no está disponible." : "No hay capacidad compatible con esta cesta. Prueba con otra cantidad, punto o día.");
          return;
        }
        setPayment({ clientSecret: data.clientSecret, subscriptionId: data.subscriptionId });
      }}
    >
      <fieldset className="admin-fieldset">
        <legend>Tu cesta</legend>
        {rows.map((row) => (
          <div key={row.key} className="component-row">
            <Select
              id={`basket-variant-${row.key}`}
              label="Pan"
              value={row.variantId}
              onChange={(e) => setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, variantId: e.target.value } : r)))}
            >
              {variants.map((v) => (
                <option key={v.id} value={v.id}>{v.label} ({formatPrice(v.priceCents)})</option>
              ))}
            </Select>
            <Input
              id={`basket-quantity-${row.key}`}
              label="Cantidad"
              type="number"
              min={1}
              max={99}
              value={row.quantity}
              onChange={(e) => setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, quantity: Math.max(1, Number(e.target.value) || 1) } : r)))}
            />
            <Button type="button" variant="secondary" disabled={rows.length <= 1} onClick={() => setRows((prev) => prev.filter((r) => r.key !== row.key))}>
              Quitar
            </Button>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => setRows((prev) => [...prev, { key: nextKey, variantId: variants[0]?.id ?? "", quantity: 1 }])}>
          Añadir otro pan
        </Button>
      </fieldset>

      <Select id="basket-frequency" label="Frecuencia" value={frequency} onChange={(e) => setFrequency(e.target.value as SubscriptionFrequency)}>
        {FREQUENCIES.map((f) => (
          <option key={f} value={f}>{FREQUENCY_LABELS_ES[f]}</option>
        ))}
      </Select>

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

      <p>
        Subtotal por ciclo: {formatPrice(subtotal)}
        {discountPercent > 0 ? <> · <strong>{discountPercent}% de descuento por llevar {totalQuantity} unidades</strong></> : <> · añade {4 - totalQuantity} unidad{4 - totalQuantity === 1 ? "" : "es"} más para el 5% de descuento</>}
      </p>
      <p><strong>Total por ciclo: {formatPrice(total)}</strong></p>

      <p>Comprobaremos la capacidad antes de crear la suscripción.</p>
      <Button type="submit" loading={busy}>Continuar con Stripe</Button>
      {message ? <Alert variant="error" title="No se ha podido continuar">{message}</Alert> : null}
    </form>
  );
}
