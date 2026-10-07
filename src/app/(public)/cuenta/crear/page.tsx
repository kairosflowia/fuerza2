import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signUpAction } from "../actions";
import { AuthForm } from "@/components/account/auth-form";
import { PageIntro } from "@/components/public/page-intro";
import { Container, Section } from "@/components/ui";
import { getCurrentIdentity } from "@/lib/auth/session";
import { safeReturnPath } from "@/lib/auth/redirects";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Crear una cuenta", description: "Crea tu cuenta FUERZA.", path: "/cuenta/crear" });

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeReturnPath((await searchParams).next);
  if (await getCurrentIdentity()) redirect(next);
  const signInHref = next === "/cuenta" ? "/cuenta/acceder" : `/cuenta/acceder?next=${encodeURIComponent(next)}`;

  return (
    <main id="main-content">
      <PageIntro eyebrow="Tu cuenta" title="Crear una cuenta" description="Guarda tus datos para futuras recogidas. No será obligatorio tener cuenta para comprar." />
      <Section><Container className="auth-layout">
        <div>
          <AuthForm action={signUpAction} fields={["full_name", "email", "phone", "password", "password_confirmation"]} submitLabel="Crear cuenta" next={next} privacyConsent />
          <p className="form-note">Entrarás en tu cuenta en cuanto la crees. No guardamos contraseñas en FUERZA.</p>
          <Link className="text-link" href={signInHref}>Ya tengo una cuenta</Link>
        </div>
      </Container></Section>
    </main>
  );
}
