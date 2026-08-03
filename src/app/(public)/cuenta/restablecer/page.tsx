import type { Metadata } from "next";

import { updatePasswordAction } from "../actions";
import { AuthForm } from "@/components/account/auth-form";
import { PageIntro } from "@/components/public/page-intro";
import { Container, Section } from "@/components/ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Nueva contraseña", description: "Define una nueva contraseña para tu cuenta FUERZA.", path: "/cuenta/restablecer" });

export default function ResetPasswordPage() {
  return (
    <main id="main-content">
      <PageIntro eyebrow="Tu cuenta" title="Define una nueva contraseña" description="El enlace de recuperación debe seguir activo en este navegador." />
      <Section><Container className="auth-layout"><AuthForm action={updatePasswordAction} fields={["password", "password_confirmation"]} submitLabel="Actualizar contraseña" /></Container></Section>
    </main>
  );
}
