"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useState } from "react";

import { ArrowRightIcon } from "@/components/ui/icons";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;

function PaymentForm({ subscriptionId }: { subscriptionId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      className="fz-payment"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!stripe || !elements || busy) return;
        setBusy(true);
        setError("");
        const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${location.origin}/plan-de-pan/confirmacion?subscription=${subscriptionId}` } });
        if (result.error) {
          setError(result.error.message ?? "No se pudo completar el pago.");
          setBusy(false);
        }
      }}
    >
      <PaymentElement />
      <p className="fz-payment__note">El primer pago y los siguientes se gestionan de forma segura con Stripe.</p>
      <button type="submit" className="fz-btn fz-btn--block" disabled={!stripe || busy}>
        {busy ? "Procesando…" : "Activar mi Plan de Pan"}
        {busy ? null : <ArrowRightIcon />}
      </button>
      {error ? <p className="fz-onboarding__error" role="alert">{error}</p> : null}
    </form>
  );
}

/** Pago recurrente con Stripe (PaymentIntent de la primera factura de la suscripción). */
export function SubscriptionPayment({ clientSecret, subscriptionId }: { clientSecret: string; subscriptionId: string }) {
  if (!stripePromise) {
    return <p className="fz-onboarding__error" role="alert">El pago recurrente todavía no está configurado.</p>;
  }
  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "flat", variables: { colorPrimary: "#C84A25", borderRadius: "10px", fontFamily: "inherit" } } }}>
      <PaymentForm subscriptionId={subscriptionId} />
    </Elements>
  );
}
