import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { BottomCheckoutBar } from "@/components/catalog/bottom-checkout-bar";
import { CatalogTopBar } from "@/components/catalog/catalog-top-bar";
import { CategoryBar } from "@/components/catalog/category-bar";
import { PickupPointProvider } from "@/components/catalog/pickup-point-provider";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { getPublicCatalog } from "@/lib/catalog";
import { earliestBookableDate } from "@/lib/order-cutoff";
import { getCutoffConfig } from "@/lib/order-cutoff-server";
import { getPublicPickupPoints } from "@/lib/pickup-points";
import { PICKUP_DATE_COOKIE, PICKUP_POINT_COOKIE } from "@/lib/pickup-selection";

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export default async function CatalogLayout({ children }: { children: ReactNode }) {
  const [catalog, { points }, cutoffConfig, cookieStore] = await Promise.all([
    getPublicCatalog(),
    getPublicPickupPoints(),
    getCutoffConfig(),
    cookies(),
  ]);
  const families = [...new Map(catalog.flatMap((p) => (p.family ? [[p.family.id, p.family]] as const : []))).values()]
    .sort((a, b) => a.display_order - b.display_order)
    .map((family) => ({ slug: family.slug, name: family.name }));
  const pickupPoints = points.filter((point) => point.status === "active").map((point) => ({ id: point.id, name: point.name }));

  const minDate = isoDate(earliestBookableDate(cutoffConfig) ?? new Date());
  const pointCookie = cookieStore.get(PICKUP_POINT_COOKIE)?.value;
  const dateCookie = cookieStore.get(PICKUP_DATE_COOKIE)?.value;
  const initialPointId = (pointCookie && pickupPoints.some((p) => p.id === pointCookie) ? pointCookie : pickupPoints[0]?.id) ?? "";
  const initialDate = dateCookie && dateCookie >= minDate ? dateCookie : minDate;

  return (
    <PickupPointProvider points={pickupPoints} initialPointId={initialPointId} initialDate={initialDate} minDate={minDate}>
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
