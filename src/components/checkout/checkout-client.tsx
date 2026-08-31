"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { useCart } from "@/components/cart/cart-provider";
import { Alert, Button, Checkbox, EmptyState, Input } from "@/components/ui";
import { availabilityReasonLabel } from "@/lib/availability-domain";
import { formatPrice } from "@/lib/catalog-domain";
import { formatDateEs } from "@/lib/order-cutoff";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;
const appearance = {
  theme: "stripe" as const,
  variables: { colorPrimary: "#e4572e", colorText: "#171412", borderRadius: "10px", fontFamily: "inherit" },
};

type Selection = { point: string; pointName?: string; date: string; key: string };
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

function ContactForm({ initialName, initialEmail, initialPhone, selection, onReady }: { initialName: string; initialEmail: string; initialPhone: string; selection: Selection | null; onReady: (p: Payment) => void }) {
  const cart = useCart();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="checkout-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!selection || busy) return;
        setBusy(true);
        setError("");
        try {
          const f = new FormData(e.currentTarget);
          const response = await fetch("/api/checkout/create", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              items: cart.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
              pickupPointId: selection.point,
              collectionDate: selection.date,
              sessionKey: selection.key,
              name: f.get("name"),
              email: f.get("email"),
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
          onReady({ secret: data.clientSecret, code: data.publicCode, token: data.lookupToken, expiresAt: data.expiresAt ?? null });
        } catch (err) {
          console.error("checkout create failed", err);
          setError("Ha ocurrido un error inesperado. Inténtalo de nuevo.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="checkout-contact-fields">
        <p className="checkout-contact-fields__label">¿Quién recoge el pedido?</p>
        <div className="checkout-contact-fields__row">
          <Input id="checkout-name" name="name" label="Nombre" defaultValue={initialName} required />
          <Input id="checkout-email" name="email" label="Correo" type="email" defaultValue={initialEmail} required />
          <Input id="checkout-phone" name="phone" label="Teléfono" type="tel" defaultValue={initialPhone} required />
        </div>
      </div>
      <Checkbox
        id="consent"
        name="consent"
        required
        label={<>Acepto las <a href="/condiciones-de-compra" target="_blank" rel="noreferrer">condiciones de compra</a> y la <a href="/privacidad" target="_blank" rel="noreferrer">política de privacidad</a>.</>}
      />
      <Checkbox id="marketing" name="marketing" label="Quiero recibir novedades de FUERZA." />
      <Button type="submit" fullWidth loading={busy} loadingLabel="Reservando…" disabled={!selection}>Pagar ahora</Button>
      {error ? <Alert variant="error" title="No se ha podido continuar">{error}</Alert> : null}
    </form>
  );
}

export function CheckoutClient({ initialName = "", initialEmail = "", initialPhone = "" }: { initialName?: string; initialEmail?: string; initialPhone?: string }) {
  const cart = useCart();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setSelection(JSON.parse(sessionStorage.getItem("fuerza-checkout") ?? "null"));
      } catch {
        // sesión sin datos de checkout todavía: se deja en null.
      }
    });
  }, []);

  if (!cart.items.length) {
    return <EmptyState title="Tu cesta está vacía" description="Añade un pan publicado antes de continuar." />;
  }
  if (!stripePromise) {
    return <Alert variant="error" title="Pago no disponible">El pago todavía no está configurado.</Alert>;
  }

  const summary = (
    <div className="checkout-summary">
      <h1>Pago</h1>
      <ul className="checkout-summary__items">
        {cart.items.map((item) => (
          <li key={item.variantId}>
            <span>{item.quantity} × {item.productName} {item.variantName ? `— ${item.variantName}` : ""}</span>
            <span>{formatPrice(item.priceCents * item.quantity)}</span>
          </li>
        ))}
      </ul>
      {selection ? (
        <p className="checkout-summary__pickup">
          Recogida en <strong>{selection.pointName || "el punto seleccionado"}</strong> el {formatDateEs(selection.date)}
        </p>
      ) : (
        <Alert variant="warning" title="Falta el punto de recogida">Vuelve a la cesta para elegir dónde y cuándo recoger tu pedido.</Alert>
      )}
      <p className="cart-summary-total"><span>Total a pagar</span><strong>{formatPrice(cart.total)}</strong></p>
    </div>
  );

  return (
    <div className="checkout-grid">
      {summary}
      <aside className="checkout-payment-panel">
        {payment ? (
          <Elements stripe={stripePromise} options={{ clientSecret: payment.secret, appearance }}>
            <PayForm code={payment.code} token={payment.token} expiresAt={payment.expiresAt} />
          </Elements>
        ) : (
          <ContactForm initialName={initialName} initialEmail={initialEmail} initialPhone={initialPhone} selection={selection} onReady={setPayment} />
        )}
      </aside>
    </div>
  );
}
