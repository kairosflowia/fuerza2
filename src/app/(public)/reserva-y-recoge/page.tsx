import Image from "next/image";
import Link from "next/link";

import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Container, Section } from "@/components/ui/layout";
import { Faq } from "@/components/public/faq";
import { PageIntro } from "@/components/public/page-intro";
import { getPublicCatalog } from "@/lib/catalog";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Reserva y recoge",
  description: "Elige una categoría, después el producto y añádelo a tu pedido para recoger en el obrador.",
  path: "/reserva-y-recoge",
});

const questions = [
  {
    question: "¿Puedo pagar cuando recoja el pan?",
    answer: "No. El pago será siempre anticipado y la reserva solo quedará confirmada cuando se complete correctamente.",
  },
  {
    question: "¿Podré comprar sin crear una cuenta?",
    answer: "Sí. Podrás completar una compra como invitado cuando el servicio esté activo.",
  },
  {
    question: "¿Qué ocurre si quiero cancelar?",
    answer: "La política de cancelación se publicará antes de activar las reservas. No queremos presentar condiciones que aún no han sido validadas.",
  },
] as const;

export default async function ReservaYRecogePage() {
  const catalog = await getPublicCatalog();
  const families = [...new Map(catalog.flatMap((p) => (p.family ? [[p.family.id, p.family]] as const : []))).values()]
    .map((family) => ({ family, count: catalog.filter((p) => p.family?.id === family.id).length }))
    .filter(({ count }) => count > 0)
    .sort((a, b) => a.family.display_order - b.family.display_order);

  return (
    <main id="main-content">
      <PageIntro
        eyebrow="Reserva y recoge"
        title="Elige qué quieres reservar"
        description="Selecciona una categoría para ver sus productos. Podrás elegir cantidad y añadirlos a tu pedido."
      />
      <Section className="reserva-hero">
        <Image src="https://images.unsplash.com/photo-1529707481702-65fc20926103?auto=format&fit=crop&w=1600&q=60" alt="" fill sizes="100vw" style={{ objectFit: "cover" }} className="reserva-hero__bg" priority={false} />
        <Container>
          <p className="reserva-brand">FUERZA</p>
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
      </Section>
      <Section tone="sunken">
        <Container className="institutional-grid">
          <div className="prose-block">
            <Badge variant="warning">Cómo funciona</Badge>
            <h2>Reserva, paga y recoge</h2>
            <p>Eliges tus productos, indicas cuándo y dónde recogerlos, y pagas por adelantado desde el carrito.</p>
            <p>No aceptaremos más reservas de las que podamos preparar y entregar.</p>
          </div>
          <div>
            <h2>Preguntas frecuentes</h2>
            <Faq items={questions} />
          </div>
        </Container>
      </Section>
    </main>
  );
}
