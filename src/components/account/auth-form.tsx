"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { AuthActionState } from "@/app/(public)/cuenta/actions";
import { Alert, Button, Input } from "@/components/ui";

const initialAuthState: AuthActionState = { status: "idle" };

interface AuthFormProps {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  fields: readonly ("full_name" | "email" | "phone" | "password" | "password_confirmation")[];
  submitLabel: string;
  next?: string;
  /** Casilla obligatoria de aceptación de la política de privacidad (alta de cuenta). */
  privacyConsent?: boolean;
}

const fieldConfig = {
  full_name: { label: "Nombre completo", type: "text", autoComplete: "name" },
  email: { label: "Correo electrónico", type: "email", autoComplete: "email" },
  phone: { label: "Teléfono", type: "tel", autoComplete: "tel" },
  password: { label: "Contraseña", type: "password", autoComplete: "current-password" },
  password_confirmation: { label: "Repite la contraseña", type: "password", autoComplete: "new-password" },
} as const;

export function AuthForm({ action, fields, submitLabel, next, privacyConsent = false }: AuthFormProps) {
  const [state, formAction, pending] = useActionState(action, initialAuthState);
  return (
    <form action={formAction} className="auth-form">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {fields.map((name) => {
        const config = fieldConfig[name];
        const isPassword = name.includes("password");
        return (
          <Input
            key={name}
            id={`auth-${name}`}
            name={name}
            label={config.label}
            type={config.type}
            autoComplete={name === "password" && fields.includes("password_confirmation") ? "new-password" : config.autoComplete}
            minLength={isPassword ? 8 : name === "phone" ? 6 : undefined}
            maxLength={name === "phone" ? 30 : undefined}
            inputMode={name === "phone" ? "tel" : undefined}
            required
          />
        );
      })}
      {privacyConsent ? (
        <label className="auth-form__consent" htmlFor="auth-privacy">
          <input id="auth-privacy" name="privacy_consent" type="checkbox" required />
          <span>He leído y acepto la <Link href="/privacidad" target="_blank">política de privacidad</Link>.</span>
        </label>
      ) : null}
      <Button type="submit" loading={pending} loadingLabel="Procesando…">{submitLabel}</Button>
      {state.message ? <Alert variant={state.status === "error" ? "error" : "success"} title={state.status === "error" ? "No se ha podido completar" : "Solicitud recibida"}>{state.message}</Alert> : null}
    </form>
  );
}
