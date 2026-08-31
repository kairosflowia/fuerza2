import { cookies } from "next/headers";

import { CartPageClient } from "@/components/cart/cart-page";
import { Container, Section } from "@/components/ui";
import { earliestBookableDate } from "@/lib/order-cutoff";
import { getCutoffConfig } from "@/lib/order-cutoff-server";
import { getPublicPickupPoints } from "@/lib/pickup-points";
import { PICKUP_DATE_COOKIE, PICKUP_POINT_COOKIE } from "@/lib/pickup-selection";

export const metadata = { title: "Cesta | FUERZA" };

export default async function CartPage() {
  const [cutoffConfig, { points: allPoints }, cookieStore] = await Promise.all([
    getCutoffConfig(),
    getPublicPickupPoints(),
    cookies(),
  ]);

  const minDateIso = (earliestBookableDate(cutoffConfig) ?? new Date()).toISOString().slice(0, 10);
  const activePoints = allPoints.filter((point) => point.status === "active");
  const points = activePoints.map((point) => ({
    id: point.id,
    name: point.name,
    collectionWindows: point.collectionWindows.map((w) => ({ weekday: w.weekday, startsAt: w.starts_at, endsAt: w.ends_at })),
  }));
  const pointCookie = cookieStore.get(PICKUP_POINT_COOKIE)?.value;
  const dateCookie = cookieStore.get(PICKUP_DATE_COOKIE)?.value;
  const initialPoint = (pointCookie && activePoints.some((p) => p.id === pointCookie) ? pointCookie : activePoints[0]?.id) ?? "";
  const initialDate = dateCookie && dateCookie >= minDateIso ? dateCookie : minDateIso;

  return (
    <main id="main-content">
      <Section>
        <Container>
          <h1>Tu Cesta</h1>
          <CartPageClient points={points} initialPoint={initialPoint} initialDate={initialDate} minDate={minDateIso} />
        </Container>
      </Section>
    </main>
  );
}
