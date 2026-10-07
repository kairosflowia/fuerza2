"use client";

import { useActionState } from "react";

import { subscribeToNewsletterAction, type NewsletterActionState } from "@/app/(public)/newsletter/actions";
import { ArrowRightIcon, MailIcon } from "@/components/ui/icons";

const initialState: NewsletterActionState = { status: "idle" };

/** Formulario de newsletter: el consentimiento es explícito y empieza desmarcado (la acción ya lo exige). */
export function Newsletter() {
  const [state, formAction, pending] = useActionState(subscribeToNewsletterAction, initialState);

  if (state.status === "success") {
    return (
      <div className="fz-newsletter" role="status">
        <p className="fz-newsletter__msg fz-newsletter__msg--success">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={formAction} className="fz-newsletter" aria-describedby={state.status === "error" ? "newsletter-error" : undefined}>
      <label className="sr-only" htmlFor="newsletter-email">Tu correo electrónico</label>
      <div className="fz-newsletter__field">
        <MailIcon />
        <input id="newsletter-email" name="email" type="email" placeholder="Tu correo electrónico" required autoComplete="email" />
        <button type="submit" className="fz-newsletter__submit" disabled={pending} aria-label={pending ? "Enviando…" : "Suscribirme"}>
          <ArrowRightIcon />
        </button>
      </div>
      <label className="fz-check">
        <input type="checkbox" name="consent" required />
        Quiero recibir novedades de FUERZA
      </label>
      {state.status === "error" ? (
        <p id="newsletter-error" className="fz-newsletter__msg fz-newsletter__msg--error" role="alert">{state.message}</p>
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element -- ilustración vectorial decorativa. */}
      <img className="fz-newsletter__sprig" src="/illustrations/sprig.svg" alt="" width={62} height={35} />
    </form>
  );
}
