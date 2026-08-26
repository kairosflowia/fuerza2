"use client";

import { useActionState } from "react";

import { subscribeToNewsletterAction, type NewsletterActionState } from "@/app/(public)/newsletter/actions";
import { Alert, Button, Checkbox, Input } from "@/components/ui";

const initialState: NewsletterActionState = { status: "idle" };

export function Newsletter() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletterAction, initialState);

  return (
    <div className="newsletter" aria-labelledby="newsletter-title">
      <div>
        <p className="eyebrow">Desde el obrador</p>
        <h2 id="newsletter-title">Te contamos lo que sale del horno</h2>
        <p>Lo que horneamos, lo que cambia y poco más. Sin spam, y puedes darte de baja cuando quieras.</p>
      </div>
      {state.status === "success" ? (
        <Alert variant="success" title="¡Listo!">{state.message}</Alert>
      ) : (
        <form action={formAction} className="newsletter__form">
          <Input id="newsletter-email" name="email" label="Tu correo" type="email" required autoComplete="email" />
          <Checkbox id="newsletter-consent" name="consent" label="Quiero recibir novedades de FUERZA por correo." description="Podrás darte de baja cuando quieras." required />
          <Button type="submit" loading={pending} loadingLabel="Enviando…">Suscribirme</Button>
          {state.status === "error" ? <Alert variant="error" title="No se ha podido completar">{state.message}</Alert> : null}
        </form>
      )}
    </div>
  );
}
