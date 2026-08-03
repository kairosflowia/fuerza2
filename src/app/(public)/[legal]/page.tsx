import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { PageIntro } from "@/components/public/page-intro";
import { isLegalSlug, legalPages } from "@/lib/legal-pages";
import { createPageMetadata } from "@/lib/seo";

interface LegalPageProps {
  params: Promise<{ legal: string }>;
}

export function generateStaticParams() {
  return Object.keys(legalPages).map((legal) => ({ legal }));
}

export async function generateMetadata({ params }: LegalPageProps): Promise<Metadata> {
  const { legal } = await params;
  if (!isLegalSlug(legal)) return {};
  const page = legalPages[legal];
  return createPageMetadata({ title: page.title, description: page.description, path: `/${legal}` });
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { legal } = await params;
  if (!isLegalSlug(legal)) notFound();
  const page = legalPages[legal];

  return (
    <main id="main-content">
      <PageIntro
        eyebrow="Información pendiente de validación"
        title={page.title}
        description={page.description}
      />
      <Section>
        <Container size="content" className="legal-content">
          <Alert variant="warning" title="Documento no definitivo">
            Esta estructura no constituye todavía una política jurídica aplicable. Los datos del titular y las condiciones se publicarán después de una revisión profesional.
          </Alert>
          {page.sections.map((section) => (
            <Card key={section} className="legal-section">
              <h2>{section}</h2>
              <p>Este apartado está reservado para el contenido validado antes de activar servicios que traten datos o permitan comprar.</p>
            </Card>
          ))}
        </Container>
      </Section>
    </main>
  );
}
