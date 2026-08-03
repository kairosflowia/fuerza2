"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

import { Button, Select } from "@/components/ui";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

function SubscriptionPayment({ subscriptionId }: { subscriptionId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return <form onSubmit={async (event) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${location.origin}/plan-de-pan/confirmacion?subscription=${subscriptionId}` },
    });
    if (result.error) {
      setError(result.error.message ?? "No se pudo completar el pago.");
      setBusy(false);
    }
  }}>
    <PaymentElement />
    <p>El primer pago y los siguientes se gestionan de forma segura con Stripe.</p>
    <Button type="submit" loading={busy} disabled={!stripe}>Activar Plan de Pan</Button>
    {error ? <p role="alert">{error}</p> : null}
  </form>;
}

export function SubscriptionConfigurator({ planId, points }: { planId: string; points: { id: string; name: string }[] }) {
  const [point, setPoint] = useState("");
  const [day, setDay] = useState("");
  const [message, setMessage] = useState("");
  const [payment, setPayment] = useState<{ clientSecret: string; subscriptionId: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (payment) {
    if (!stripePromise) return <p role="alert">El pago recurrente todavía no está configurado.</p>;
    return <Elements stripe={stripePromise} options={{ clientSecret: payment.clientSecret, appearance: { theme: "flat" } }}>
      <SubscriptionPayment subscriptionId={payment.subscriptionId} />
    </Elements>;
  }

  return <form onSubmit={async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/subscriptions/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ planId, pickupPointId: point, weekday: Number(day) }),
    });
    const data = await response.json();
    setBusy(false);
    if (!response.ok || !data.clientSecret) {
      setMessage(response.status === 503 ? "El pago recurrente todavía no está disponible." : "No hay capacidad compatible para esta configuración.");
      return;
    }
    setPayment({ clientSecret: data.clientSecret, subscriptionId: data.subscriptionId });
  }}>
    <Select id="subscription-point" label="Punto de recogida" value={point} onChange={(event) => setPoint(event.target.value)} required>
      <option value="">Selecciona</option>
      {points.map((pickupPoint) => <option value={pickupPoint.id} key={pickupPoint.id}>{pickupPoint.name}</option>)}
    </Select>
    <Select id="subscription-day" label="Día habitual" value={day} onChange={(event) => setDay(event.target.value)} required>
      <option value="">Selecciona</option>
      {[1, 2, 3, 4, 5, 6, 7].map((weekday) => <option key={weekday} value={weekday}>{["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"][weekday - 1]}</option>)}
    </Select>
    <p>Comprobaremos la capacidad antes de crear la subscripción.</p>
    <Button type="submit" loading={busy}>Continuar con Stripe</Button>
    {message ? <p role="alert">{message}</p> : null}
  </form>;
}
