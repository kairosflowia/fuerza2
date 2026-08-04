import type { ReactNode } from "react";

import { BottomCheckoutBar } from "@/components/catalog/bottom-checkout-bar";
import { CatalogTopBar } from "@/components/catalog/catalog-top-bar";
import { CategoryBar } from "@/components/catalog/category-bar";
import { PickupPointProvider } from "@/components/catalog/pickup-point-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { getPublicCatalog } from "@/lib/catalog";
import { getPublicPickupPoints } from "@/lib/pickup-points";

export default async function CatalogLayout({ children }: { children: ReactNode }) {
  const [catalog, { points }] = await Promise.all([getPublicCatalog(), getPublicPickupPoints()]);
  const families = [...new Map(catalog.flatMap((p) => (p.family ? [[p.family.id, p.family]] as const : []))).values()]
    .sort((a, b) => a.display_order - b.display_order)
    .map((family) => ({ slug: family.slug, name: family.name }));
  const pickupPoints = points.map((point) => ({ id: point.id, name: point.name }));

  return (
    <PickupPointProvider points={pickupPoints}>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <div className="catalog-shell">
        <div className="catalog-header">
          <CatalogTopBar />
          <CategoryBar families={families} />
        </div>
        {children}
      </div>
      <BottomCheckoutBar />
      <PwaRegister />
    </PickupPointProvider>
  );
}
