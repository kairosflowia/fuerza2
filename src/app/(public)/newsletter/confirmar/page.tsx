import type { Metadata } from "next";

import { NewsletterConfirmForm } from "@/components/public/newsletter-confirm-form";
import { PageIntro } from "@/components/public/page-intro";
import { Alert, Container, Section } from "@/components/ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Confirmar suscripción", description: "Confirma tu suscripción a la newsletter de FUERZA.", path: "/newsletter/confirmar" });

export default async function ConfirmNewsletterPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <main id="main-content">
      <PageIntro eyebrow="Newsletter" title="Confirma tu suscripción" description="Un último paso: confirma que quieres recibir novedades de FUERZA por correo." />
      <Section>
        <Container className="auth-layout">
          {token ? (
            <NewsletterConfirmForm token={token} />
          ) : (
            <Alert variant="error" title="Enlace no válido">Falta el código de confirmación. Revisa el enlace que recibiste por correo.</Alert>
          )}
        </Container>
      </Section>
    </main>
  );
}
