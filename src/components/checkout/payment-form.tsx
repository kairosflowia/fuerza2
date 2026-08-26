"use client";

import { useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { Alert, Button } from "@/components/ui";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) : null;

function Form({ code, token }: { code: string; token: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setBusy(true);
        setError("");
        const result = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${location.origin}/checkout/pago?pedido=${code}&token=${encodeURIComponent(token)}` } });
        if (result.error) {
          setError(result.error.message ?? "No se pudo completar el pago.");
          setBusy(false);
        }
      }}
    >
      <PaymentElement />
      <Button type="submit" fullWidth loading={busy} loadingLabel="Procesando…" disabled={!stripe}>Pagar ahora</Button>
      {error ? <Alert variant="error" title="No se ha podido pagar">{error}</Alert> : null}
    </form>
  );
}

export function PaymentForm({ secret, code, token }: { secret: string; code: string; token: string }) {
  if (!stripePromise) return <Alert variant="error" title="Pago no disponible">El pago todavía no está configurado.</Alert>;
  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#e4572e",
      colorText: "#171412",
      borderRadius: "10px",
      fontFamily: "inherit",
    },
  };
  return (
    <Elements stripe={stripePromise} options={{ clientSecret: secret, appearance }}>
      <Form code={code} token={token} />
    </Elements>
  );
}
