import Image from "next/image";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Container } from "@/components/ui/layout";
import { OrderSummarySidebar } from "@/components/catalog/order-summary-sidebar";
import { WeeklySpecialBanner } from "@/components/public/weekly-special-banner";
import { getPublicCatalog } from "@/lib/catalog";
import { getCutoffConfig } from "@/lib/order-cutoff-server";
import { createPageMetadata } from "@/lib/seo";
import { getCurrentWeeklySpecial } from "@/lib/weekly-special";

export const metadata = createPageMetadata({
  title: "Reserva y recoge",
  description: "Elige una categoría, después el producto y añádelo a tu pedido para recoger en el obrador.",
  path: "/reserva-y-recoge",
});

export default async function ReservaYRecogePage() {
  const [catalog, cutoffConfig, weeklySpecial] = await Promise.all([getPublicCatalog(), getCutoffConfig(), getCurrentWeeklySpecial()]);
  const families = [...new Map(catalog.flatMap((p) => (p.family ? [[p.family.id, p.family]] as const : []))).values()]
    .map((family) => ({ family, count: catalog.filter((p) => p.family?.id === family.id).length }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => a.family.display_order - b.family.display_order);

  return (
    <main id="main-content" className="catalog-layout">
      <div className="catalog-layout__main">
        <Container>
          <Image className="reserva-brand" src="/nombre-fuerza.svg" alt="FUERZA" width={280} height={280} priority />
          {weeklySpecial ? <WeeklySpecialBanner special={weeklySpecial} /> : null}
          {families.length ? (
            <div className="category-grid">
              {families.map(({ family, count }) => {
                const sample = catalog.find((p) => p.family?.id === family.id);
                const image = sample?.images.find((i) => i.is_primary) ?? sample?.images[0];
                return (
                  <Link key={family.id} href={`/reserva-y-recoge/${family.slug}`} className="category-card">
                    <span className="category-card__image">
                      {image ? (
                        <Image src={`/api/product-images/${image.storage_path}`} alt="" width={200} height={200} />
                      ) : null}
                    </span>
                    <span className="category-card__body">
                      <span className="category-card__name">{family.name}</span>
                      <span className="category-card__count">({count} producto{count === 1 ? "" : "s"})</span>
                    </span>
                    <span className="category-card__chevron" aria-hidden="true">›</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <Alert variant="information" title="Todavía no hay categorías publicadas">
              El catálogo aparecerá aquí en cuanto el obrador dé de alta sus primeros productos.
            </Alert>
          )}
        </Container>
      </div>
      <OrderSummarySidebar cutoffConfig={cutoffConfig} />
    </main>
  );
}
