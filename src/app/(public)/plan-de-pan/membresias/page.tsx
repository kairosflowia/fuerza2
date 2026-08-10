import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { BasketConfigurator } from "@/components/subscriptions/basket-configurator";
import { PageIntro } from "@/components/public/page-intro";
import { Container, Section } from "@/components/ui";
import { getCurrentIdentity } from "@/lib/auth/session";
import { createPageMetadata } from "@/lib/seo";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionFrequency } from "@/lib/subscriptions-domain";

export const metadata: Metadata = createPageMetadata({
  title: "Membresías Fuerza Habitual",
  description: "Elige tu pan y tu frecuencia para Fuerza Habitual.",
  path: "/plan-de-pan/membresias",
});

const VALID_FREQUENCIES: SubscriptionFrequency[] = ["weekly", "biweekly", "every_3_weeks", "monthly"];

export default async function MembresiasPage({ searchParams }: { searchParams: Promise<{ frecuencia?: string }> }) {
  const identity = await getCurrentIdentity();
  if (!identity) redirect("/cuenta/acceder?next=/plan-de-pan/membresias");
  const { frecuencia } = await searchParams;
  const initialFrequency = VALID_FREQUENCIES.find((f) => f === frecuencia);

  const db: any = await createClient();
  const [{ data: variants }, { data: products }, { data: images }, { data: points }] = await Promise.all([
    db.from("product_variants").select("id,name,price_cents,product_id").eq("status", "active").eq("subscribable", true).not("price_cents", "is", null).order("name"),
    db.from("products").select("id,name").eq("status", "active"),
    db.from("product_images").select("product_id,storage_path,is_primary").order("display_order"),
    db.from("pickup_points_public").select("id,name").eq("status", "active"),
  ]);
  const productName = (id: string) => products?.find((p: any) => p.id === id)?.name ?? "Producto";
  const productImage = (id: string) => {
    const forProduct = (images ?? []).filter((i: any) => i.product_id === id);
    return forProduct.find((i: any) => i.is_primary)?.storage_path ?? forProduct[0]?.storage_path ?? null;
  };
  const options = (variants ?? [])
    .map((v: any) => ({
      id: v.id,
      name: v.name === "Única" ? productName(v.product_id) : `${productName(v.product_id)} — ${v.name}`,
      priceCents: v.price_cents as number,
      imagePath: productImage(v.product_id),
    }))
    .sort((a: any, b: any) => a.name.localeCompare(b.name));

  return (
    <main id="main-content">
      <PageIntro
        eyebrow="Explora los panes disponibles"
        title="Membresías Fuerza Habitual"
        description="Elige el pan que quieres recibir, la cantidad y la frecuencia. Con 4 unidades o más en tu cesta, el 5% de descuento se aplica automáticamente."
      />
      <Section>
        <Container size="wide">
          <BasketConfigurator variants={options} pickupPoints={points ?? []} initialFrequency={initialFrequency} />
        </Container>
      </Section>
    </main>
  );
}
