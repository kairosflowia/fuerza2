import type { Metadata } from "next";
import Link from "next/link";

import { requestPasswordResetAction } from "../actions";
import { AuthForm } from "@/components/account/auth-form";
import { PageIntro } from "@/components/public/page-intro";
import { Container, Section } from "@/components/ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Recuperar contraseña", description: "Recupera el acceso a tu cuenta FUERZA.", path: "/cuenta/recuperar" });

export default function RecoverPage() {
  return (
    <main id="main-content">
      <PageIntro eyebrow="Tu cuenta" title="Recuperar contraseña" description="Indica tu correo. La respuesta será la misma exista o no una cuenta asociada." />
      <Section><Container className="auth-layout"><div>
        <AuthForm action={requestPasswordResetAction} fields={["email"]} submitLabel="Enviar instrucciones" />
        <Link className="text-link" href="/cuenta/acceder">Volver a acceder</Link>
      </div></Container></Section>
    </main>
  );
}
