"use client";

import { useActionState } from "react";

import { unsubscribeNewsletterAction, type NewsletterActionState } from "@/app/(public)/newsletter/actions";
import { Alert, Button, Textarea } from "@/components/ui";

const initialState: NewsletterActionState = { status: "idle" };

export function NewsletterUnsubscribeForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(unsubscribeNewsletterAction, initialState);

  if (state.status === "success") {
    return <Alert variant="success" title="Baja completada">{state.message}</Alert>;
  }

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="token" value={token} />
      <Textarea id="newsletter-unsubscribe-reason" name="reason" label="¿Nos cuentas por qué te das de baja?" optional helpText="Solo lo verá el equipo de FUERZA." rows={3} />
      <Button type="submit" variant="secondary" loading={pending} loadingLabel="Procesando…">Darme de baja</Button>
      {state.status === "error" ? <Alert variant="error" title="No se ha podido completar">{state.message}</Alert> : null}
    </form>
  );
}
