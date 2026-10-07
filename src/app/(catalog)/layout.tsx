import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { BottomCheckoutBar } from "@/components/catalog/bottom-checkout-bar";
import { CategoryBar } from "@/components/catalog/category-bar";
import { PickupBar } from "@/components/catalog/pickup-bar";
import { PickupPointProvider } from "@/components/catalog/pickup-point-provider";
import { PublicHeader } from "@/components/public/public-header";
import { PwaRegister } from "@/components/pwa/pwa-register";
import { getPublicCatalog } from "@/lib/catalog";
import { earliestBookableIsoDate, operationalToday } from "@/lib/order-cutoff";
import { getCutoffConfig } from "@/lib/order-cutoff-server";
import { getPublicPickupPoints } from "@/lib/pickup-points";
import { PICKUP_DATE_COOKIE, PICKUP_POINT_COOKIE } from "@/lib/pickup-selection";

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
  const pickupPoints = points
    .filter((point) => point.status === "active")
    .map((point) => ({ id: point.id, name: point.name, address: [point.address_line_1, point.city].filter(Boolean).join(", ") || null }));

  const minDate = earliestBookableIsoDate(cutoffConfig) ?? operationalToday();
  const pointCookie = cookieStore.get(PICKUP_POINT_COOKIE)?.value;
  const dateCookie = cookieStore.get(PICKUP_DATE_COOKIE)?.value;
  const initialPointId = (pointCookie && pickupPoints.some((p) => p.id === pointCookie) ? pointCookie : pickupPoints[0]?.id) ?? "";
  const initialDate = dateCookie && dateCookie >= minDate ? dateCookie : minDate;

  return (
    <PickupPointProvider points={pickupPoints} initialPointId={initialPointId} initialDate={initialDate} minDate={minDate}>
      <a className="skip-link" href="#main-content">Saltar al contenido</a>
      <div className="fz catalog-shell">
        <PublicHeader />
        <div className="fz-container fz-catalog-top">
          <PickupBar />
          <CategoryBar families={families} />
        </div>
        {children}
      </div>
      <BottomCheckoutBar />
      <PwaRegister />
    </PickupPointProvider>
  );
}
