import type { Metadata } from "next";
import Link from "next/link";

import { CatalogProductCard } from "@/components/public/catalog-product-card";
import { PageIntro } from "@/components/public/page-intro";
import { Container, EmptyState, Section } from "@/components/ui";
import { getPublicCatalog } from "@/lib/catalog";
import { createPageMetadata } from "@/lib/seo";

export const metadata: Metadata = createPageMetadata({
  title: "El pan que horneamos",
  description: "Catálogo de panes de masa madre publicados por FUERZA.",
  path: "/pan",
});

export default async function PanPage({ searchParams }: { searchParams: Promise<{ familia?: string }> }) {
  const catalog = await getPublicCatalog();
  const family = (await searchParams).familia;
  const visible = family ? catalog.filter((p) => p.family?.slug === family) : catalog;
  const families = [...new Map(catalog.flatMap((p) => (p.family ? [p.family] : [])).map((f) => [f.id, f])).values()];

  return (
    <main id="main-content">
      <PageIntro title="El pan" eyebrow="Catálogo" description="Lo que está publicado por el obrador. Para reservar una fecha y recogerlo, ve a Reserva y recoge." />
      <Section>
        <Container size="wide">
          <nav className="catalog-filters" aria-label="Filtrar por familia">
            <Link href="/pan" aria-current={!family ? "page" : undefined}>Todos</Link>
            {families.map((f) => (
              <Link key={f.id} href={`/pan?familia=${f.slug}`} aria-current={family === f.slug ? "page" : undefined}>{f.name}</Link>
            ))}
          </nav>

          {visible.length ? (
            <div className="catalog-grid">
              {visible.map((p) => {
                const image = p.images.find((i) => i.is_primary) ?? p.images[0];
                const activeVariants = p.variants.filter((v) => v.status === "active" && v.price_cents !== null);
                const cheapest = activeVariants.length ? activeVariants.reduce((min, v) => (v.price_cents! < min.price_cents! ? v : min)) : null;
                return (
                  <CatalogProductCard
                    key={p.id}
                    href={`/pan/${p.slug}`}
                    familyName={p.family?.name}
                    name={p.name}
                    imagePath={image?.storage_path ?? null}
                    priceCents={cheapest?.price_cents ?? null}
                    isSeasonal={p.status === "seasonal"}
                    variant={cheapest ? { id: cheapest.id, name: cheapest.name, priceCents: cheapest.price_cents! } : null}
                  />
                );
              })}
            </div>
          ) : (
            <EmptyState title="Todavía no hay panes publicados" description="El catálogo aparecerá aquí cuando el obrador dé de alta sus primeros productos reales." />
          )}
        </Container>
      </Section>
    </main>
  );
}
