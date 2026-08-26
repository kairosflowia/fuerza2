import type { Metadata } from "next";

import { NewsletterUnsubscribeForm } from "@/components/public/newsletter-unsubscribe-form";
import { PageIntro } from "@/components/public/page-intro";
import { Alert, Container, Section } from "@/components/ui";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({ title: "Darse de baja", description: "Date de baja de la newsletter de FUERZA.", path: "/newsletter/baja" });

export default async function UnsubscribeNewsletterPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;

  return (
    <main id="main-content">
      <PageIntro eyebrow="Newsletter" title="Darte de baja" description="Confirma que quieres dejar de recibir la newsletter de FUERZA. Seguirás recibiendo los correos de tus pedidos si tienes alguno en curso." />
      <Section>
        <Container className="auth-layout">
          {token ? (
            <NewsletterUnsubscribeForm token={token} />
          ) : (
            <Alert variant="error" title="Enlace no válido">Falta el código de baja. Revisa el enlace que recibiste por correo.</Alert>
          )}
        </Container>
      </Section>
    </main>
  );
}
