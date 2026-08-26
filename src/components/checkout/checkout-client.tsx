"use client";

import { useEffect, useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import { Alert, Button, Checkbox, Input } from "@/components/ui";
import { formatPrice } from "@/lib/catalog-domain";

import { PaymentForm } from "./payment-form";

type Selection = { point: string; pointName?: string; date: string; key: string };
type Payment = { secret: string; code: string; token: string; expiresAt: string };

export function CheckoutClient({ initialName = "", initialEmail = "", initialPhone = "" }: { initialName?: string; initialEmail?: string; initialPhone?: string }) {
  const cart = useCart();
  const [selection, setSelection] = useState<Selection | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        setSelection(JSON.parse(sessionStorage.getItem("fuerza-checkout") ?? "null"));
      } catch {
        // sesión sin datos de checkout todavía: se deja en null.
      }
    });
  }, []);

  const summary = (
    <div className="checkout-summary">
      <h1>{payment ? "Elige cómo pagar" : "Confirma tus datos"}</h1>
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
          Recogida en <strong>{selection.pointName || "el punto seleccionado"}</strong> el {selection.date}
        </p>
      ) : null}
      <p className="checkout-summary-total"><span>Total a pagar</span><strong>{formatPrice(cart.total)}</strong></p>
    </div>
  );

  return (
    <div className="checkout-grid">
      {summary}
      <aside className="checkout-payment-panel">
        {payment ? (
          <>
            <p className="field__help">Tu disponibilidad está reservada hasta las {new Date(payment.expiresAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}. No se paga en el punto de recogida.</p>
            <PaymentForm secret={payment.secret} code={payment.code} token={payment.token} />
          </>
        ) : (
          <form
            className="checkout-form"
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              setBusy(true);
              setError("");
              const f = new FormData(e.currentTarget);
              const response = await fetch("/api/checkout/create", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  items: cart.items.map((i) => ({ variant_id: i.variantId, quantity: i.quantity })),
                  pickupPointId: selection?.point,
                  collectionDate: selection?.date,
                  sessionKey: selection?.key,
                  name: f.get("name"),
                  email: f.get("email"),
                  phone: f.get("phone"),
                  terms: f.get("consent") === "on",
                  privacy: f.get("consent") === "on",
                  marketing: f.get("marketing") === "on",
                }),
              });
              const data = await response.json();
              if (!response.ok) {
                setError("No hemos podido reservar la disponibilidad. Revisa los datos e inténtalo de nuevo.");
                setBusy(false);
                return;
              }
              setPayment({ secret: data.clientSecret, code: data.publicCode, token: data.lookupToken, expiresAt: data.expiresAt });
            }}
          >
            <Input id="checkout-name" name="name" label="Nombre" defaultValue={initialName} required />
            <Input id="checkout-email" name="email" label="Correo electrónico" type="email" defaultValue={initialEmail} required />
            <Input id="checkout-phone" name="phone" label="Teléfono" type="tel" defaultValue={initialPhone} required />
            <Checkbox
              id="consent"
              name="consent"
              required
              label={<>Acepto las <a href="/condiciones-de-compra" target="_blank" rel="noreferrer">condiciones de compra</a> y la <a href="/privacidad" target="_blank" rel="noreferrer">política de privacidad</a>.</>}
            />
            <Checkbox id="marketing" name="marketing" label="Quiero recibir novedades de FUERZA." />
            <Button type="submit" fullWidth loading={busy} loadingLabel="Reservando…" disabled={!selection || !cart.items.length}>
              Continuar al pago
            </Button>
            {error ? <Alert variant="error" title="No se ha podido continuar">{error}</Alert> : null}
          </form>
        )}
      </aside>
    </div>
  );
}
