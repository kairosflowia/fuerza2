"use client";

import { useActionState } from "react";

import type { AuthActionState } from "@/app/(public)/cuenta/actions";
import { Alert, Button, Input } from "@/components/ui";

const initialAuthState: AuthActionState = { status: "idle" };

interface AuthFormProps {
  action: (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;
  fields: readonly ("full_name" | "email" | "password" | "password_confirmation")[];
  submitLabel: string;
  next?: string;
}

const fieldConfig = {
  full_name: { label: "Nombre completo", type: "text", autoComplete: "name" },
  email: { label: "Correo electrónico", type: "email", autoComplete: "email" },
  password: { label: "Contraseña", type: "password", autoComplete: "current-password" },
  password_confirmation: { label: "Repite la contraseña", type: "password", autoComplete: "new-password" },
} as const;

export function AuthForm({ action, fields, submitLabel, next }: AuthFormProps) {
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
            minLength={isPassword ? 8 : undefined}
            required
          />
        );
      })}
      <Button type="submit" loading={pending} loadingLabel="Procesando…">{submitLabel}</Button>
      {state.message ? <Alert variant={state.status === "error" ? "error" : "success"} title={state.status === "error" ? "No se ha podido completar" : "Solicitud recibida"}>{state.message}</Alert> : null}
    </form>
  );
}
