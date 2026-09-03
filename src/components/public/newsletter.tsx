"use client";

import { useActionState } from "react";

import { subscribeToNewsletterAction, type NewsletterActionState } from "@/app/(public)/newsletter/actions";
import { Alert, Button } from "@/components/ui";
import { MailIcon } from "@/components/ui/icons";

const initialState: NewsletterActionState = { status: "idle" };

export function Newsletter() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletterAction, initialState);

  return (
    <div className="newsletter" aria-labelledby="newsletter-title">
      <span className="newsletter__icon" aria-hidden="true">
        <MailIcon />
      </span>
      <div className="newsletter__text">
        <h2 id="newsletter-title">Te contamos lo que sale del horno</h2>
        <p>Recibe nuestra selección del día y novedades de FUERZA pan.</p>
      </div>
      {state.status === "success" ? (
        <Alert variant="success" title="¡Listo!">{state.message}</Alert>
      ) : (
        <form action={formAction} className="newsletter__form">
          <input type="hidden" name="consent" value="on" />
          <div className="newsletter__field">
            <input
              id="newsletter-email"
              name="email"
              type="email"
              placeholder="Tu correo electrónico"
              required
              autoComplete="email"
              className="newsletter__input"
            />
            <Button type="submit" loading={pending} loadingLabel="Enviando…">Suscribirme</Button>
          </div>
          <p className="newsletter__hint">Puedes darte de baja cuando quieras.</p>
          {state.status === "error" ? <Alert variant="error" title="No se ha podido completar">{state.message}</Alert> : null}
        </form>
      )}
    </div>
  );
}
