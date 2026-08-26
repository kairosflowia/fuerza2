"use client";

import { useActionState } from "react";

import { confirmNewsletterAction, type NewsletterActionState } from "@/app/(public)/newsletter/actions";
import { Alert, Button } from "@/components/ui";

const initialState: NewsletterActionState = { status: "idle" };

export function NewsletterConfirmForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(confirmNewsletterAction, initialState);

  if (state.status === "success") {
    return <Alert variant="success" title="¡Confirmado!">{state.message}</Alert>;
  }

  return (
    <form action={formAction} className="auth-form">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" loading={pending} loadingLabel="Confirmando…">Confirmar mi suscripción</Button>
      {state.status === "error" ? <Alert variant="error" title="No se ha podido confirmar">{state.message}</Alert> : null}
    </form>
  );
}
