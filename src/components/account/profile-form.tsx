"use client";

import { useActionState } from "react";

import { updateProfileAction, type AuthActionState } from "@/app/(public)/cuenta/actions";
import { Alert, Button, Input } from "@/components/ui";

const initialAuthState: AuthActionState = { status: "idle" };

export function ProfileForm({ fullName, phone }: { fullName: string; phone: string }) {
  const [state, action, pending] = useActionState(updateProfileAction, initialAuthState);
  return (
    <form action={action} className="auth-form">
      <Input id="profile-name" name="full_name" label="Nombre completo" defaultValue={fullName} maxLength={120} required />
      <Input id="profile-phone" name="phone" label="Teléfono" optional defaultValue={phone} maxLength={30} type="tel" />
      <Button type="submit" loading={pending} loadingLabel="Guardando…">Guardar perfil</Button>
      {state.message ? <Alert variant={state.status === "error" ? "error" : "success"} title={state.status === "error" ? "No se ha guardado" : "Cambios guardados"}>{state.message}</Alert> : null}
    </form>
  );
}
