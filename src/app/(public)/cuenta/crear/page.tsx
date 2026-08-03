import type { Metadata } from "next";
import Link from "next/link";

import { signUpAction } from "../actions";
import { AuthForm } from "@/components/account/auth-form";
import { PageIntro } from "@/components/public/page-intro";
import { Container, Section } from "@/components/ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Crear una cuenta", description: "Crea tu cuenta FUERZA.", path: "/cuenta/crear" });

export default function SignUpPage() {
  return (
    <main id="main-content">
      <PageIntro eyebrow="Tu cuenta" title="Crear una cuenta" description="Guarda tus datos para futuras recogidas. No será obligatorio tener cuenta para comprar." />
      <Section><Container className="auth-layout">
        <div>
          <AuthForm action={signUpAction} fields={["full_name", "email", "password", "password_confirmation"]} submitLabel="Crear cuenta" />
          <p className="form-note">Al crear la cuenta recibirás un correo de confirmación. No guardamos contraseñas en FUERZA.</p>
          <Link className="text-link" href="/cuenta/acceder">Ya tengo una cuenta</Link>
        </div>
      </Container></Section>
    </main>
  );
}
