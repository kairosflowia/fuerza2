import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { PageIntro } from "@/components/public/page-intro";
import { isLegalSlug, isPendingBlock, legalPages, resolveTitularBlock, type LegalOwnerIdentity } from "@/lib/legal-pages";
import { createPageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface LegalPageProps {
  params: Promise<{ legal: string }>;
}

const IDENTITY_SLUGS = new Set(["aviso-legal", "privacidad"]);
const IDENTITY_HEADING: Record<string, string> = {
  "aviso-legal": "Titularidad del sitio",
  privacidad: "Responsable del tratamiento",
};

export function generateStaticParams() {
  return Object.keys(legalPages).map((legal) => ({ legal }));
}

async function loadOwnerIdentity(): Promise<LegalOwnerIdentity | null> {
  const db = (await createClient()) as any;
  const { data } = await db
    .from("app_settings")
    .select("key,value")
    .in("key", ["legal.controller_name", "legal.tax_id", "legal.fiscal_address", "legal.contact_email"]);
  if (!data) return null;
  const get = (key: string) => {
    const raw = data.find((row: any) => row.key === key)?.value;
    return typeof raw === "string" ? raw : null;
  };
  return {
    controllerName: get("legal.controller_name"),
    taxId: get("legal.tax_id"),
    fiscalAddress: get("legal.fiscal_address"),
    contactEmail: get("legal.contact_email"),
  };
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

  let content = page.content;
  if (IDENTITY_SLUGS.has(legal)) {
    const identity = await loadOwnerIdentity();
    content = [resolveTitularBlock(IDENTITY_HEADING[legal], identity), ...page.content.slice(1)];
  }

  return (
    <main id="main-content">
      <PageIntro eyebrow="Información legal" title={page.title} description={page.description} />
      <Section>
        <Container size="content" className="legal-content">
          {content.map((block) =>
            isPendingBlock(block) ? (
              <Alert key={block.heading} variant="warning" title={block.heading}>
                {block.note}
              </Alert>
            ) : (
              <Card key={block.heading} className="legal-section">
                <h2>{block.heading}</h2>
                {block.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </Card>
            )
          )}
        </Container>
      </Section>
    </main>
  );
}
