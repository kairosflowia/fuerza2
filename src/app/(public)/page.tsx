import type { Metadata } from "next";
import Link from "next/link";

import { BreadAnatomy } from "@/components/public/bread-anatomy";
import { EditorialGrid, EditorialProductPreview, SectionHeading, TextLink, ValueCard } from "@/components/public/editorial";
import { HeroCarousel } from "@/components/public/hero-carousel";
import { HeroVideo } from "@/components/public/hero-video";
import { Newsletter } from "@/components/public/newsletter";
import { ProcessTimeline, type ProcessStep } from "@/components/public/process-timeline";
import { Container, Section } from "@/components/ui";
import { WeeklySpecialBanner } from "@/components/public/weekly-special-banner";
import { getPublicCatalog } from "@/lib/catalog";
import { createPageMetadata } from "@/lib/seo";
import { getCurrentWeeklySpecial } from "@/lib/weekly-special";

export const metadata: Metadata = createPageMetadata({
  title: "Pan de masa madre en Asturias",
  description: "Obrador de masa madre en Asturias. Harinas locales, fermentación lenta y cantidad limitada cada día. Reserva tu pan y recógelo cuando te venga bien.",
  path: "/",
  ogTitle: "FUERZA — Obrador de masa madre en Asturias",
  ogDescription: "Reservas el pan antes de que lo horneemos. Nosotros hacemos exactamente el que hace falta.",
});

const processSteps: ProcessStep[] = [
  { number: "01", title: "Masa madre", text: "Cada día le damos harina y agua. Sin eso, no hay pan al día siguiente.", image: "https://images.unsplash.com/photo-1595801105145-795f1927c0fc?auto=format&fit=crop&w=1000&q=75" },
  { number: "02", title: "Amasado", text: "Harina, agua y sal. La masa se trabaja poco y descansa mucho.", image: "https://images.unsplash.com/photo-1517686469429-8bdb88b9f907?auto=format&fit=crop&w=1000&q=75" },
  { number: "03", title: "Reposo", text: "Aquí no pasa nada visible y pasa todo. El sabor necesita tiempo.", image: "https://images.unsplash.com/photo-1598634549802-dcc558705f19?auto=format&fit=crop&w=1000&q=75" },
  { number: "04", title: "Horno", text: "Formamos cada pieza a mano. El horno termina lo que empezó el tiempo.", image: "https://images.unsplash.com/photo-1732565729552-994c6af761e3?auto=format&fit=crop&w=1000&q=75" },
  { number: "05", title: "Recogida", text: "Sale del horno y va al punto donde lo hayas reservado.", image: "https://images.unsplash.com/photo-1612136435571-c97705feadfa?auto=format&fit=crop&w=1000&q=75" },
];

export default async function Home() {
  const [catalog, weeklySpecial] = await Promise.all([getPublicCatalog(), getCurrentWeeklySpecial()]);
  const rusticBreads = catalog.filter((p) => p.family?.slug === "hogazas-artesanas").slice(0, 3);

  return (
    <main id="main-content">
      <HeroCarousel />

      {weeklySpecial ? (
        <Section>
          <Container size="wide">
            <WeeklySpecialBanner special={weeklySpecial} />
          </Container>
        </Section>
      ) : null}

      <Section>
        <Container size="wide">
          <SectionHeading eyebrow="Por dentro" title="Anatomía de nuestra hogaza" description="Pasa el cursor o toca cada punto para saber qué hace que este pan sea distinto." />
          <BreadAnatomy />
        </Container>
      </Section>

      <Section>
        <Container size="wide">
          <SectionHeading eyebrow="Lo que sale del horno" title="El catálogo empieza aquí" description="Pan rústico de fermentación lenta, horneado en cantidad limitada cada día." />
          <EditorialGrid>
            {rusticBreads.map((product) => {
              const image = product.images.find((i) => i.is_primary) ?? product.images[0];
              const prices = product.variants.flatMap((v) => (v.price_cents === null ? [] : [v.price_cents]));
              return (
                <EditorialProductPreview
                  key={product.id}
                  slug={product.slug}
                  name={product.name}
                  description={product.short_description}
                  imagePath={image?.storage_path ?? null}
                  imageAlt={image?.alt_text ?? ""}
                  priceCents={prices.length ? Math.min(...prices) : null}
                />
              );
            })}
          </EditorialGrid>
          <TextLink href="/pan">Ver la estructura del pan</TextLink>
        </Container>
      </Section>

      <Section tone="sunken">
        <Container size="wide">
          <SectionHeading
            eyebrow="Pan fresco en casa, cada semana"
            title="Fuerza Habitual"
            description="Suscríbete y recibe tu pan de masa madre sin tener que reservar cada vez. Con 4 unidades o más en tu cesta, el 5% de descuento se aplica automáticamente."
          />
          <div className="component-row">
            <Link className="button button--primary" href="/plan-de-pan">Conocer Fuerza Habitual</Link>
            <Link className="button button--secondary" href="/plan-de-pan/membresias">Ver membresías</Link>
          </div>
        </Container>
      </Section>

      <Section>
        <Container size="wide">
          <SectionHeading eyebrow="El tiempo que transforma" title="Lo que ocurre antes de abrir el horno" description="Pasa el cursor o toca cada paso para ver qué ocurre en ese momento." />
          <ProcessTimeline steps={processSteps} />
          <Link className="button process-cta" href="/obrador">Ver cómo trabajamos <span className="process-cta__arrow" aria-hidden="true">→</span></Link>
        </Container>
      </Section>

      <Section className="pillars-section">
        <Container size="wide">
          <SectionHeading eyebrow="Lo que nos mueve" title="Cuatro cosas que no negociamos" />
          <EditorialGrid columns={4}>
            <ValueCard image="/05-tradicion-que-se-siente.svg" title="Tradición que se siente" tone="terracotta">Hacemos pan como se hacía antes de que hubiera prisa. No por nostalgia: porque sale mejor.</ValueCard>
            <ValueCard image="/04-ingredientes-que-cuentan.svg" title="Ingredientes que cuentan" tone="yellow">Harina, agua, sal y masa madre. Si un ingrediente no hace falta, no está.</ValueCard>
            <ValueCard image="/03-tiempo-que-transforma.svg" title="Tiempo que transforma" tone="green">La fermentación lenta no se puede acelerar. Es la parte del trabajo que hace el reloj.</ValueCard>
            <ValueCard image="/02-comunidad-que-nos-inspira.svg" title="Comunidad que nos inspira" tone="blue">Un obrador pequeño vive de la gente que vuelve y de quienes trabajan cerca.</ValueCard>
          </EditorialGrid>
        </Container>
      </Section>

      <HeroVideo videoSrc="/videos/harina-masa.mp4" poster="/videos/harina-masa-poster.jpg" posterAlt="Manos trabajando una masa de pan espolvoreada con harina.">
        <div><p className="eyebrow">Asturias</p><h2>Harina de aquí</h2></div>
        <div><p>Asturias tiene cereal, molinos y gente que sabe de esto. La producción local mantiene el pan cerca de su origen y del lugar donde se comparte.</p><p>Publicaremos cada procedencia cuando estén confirmados los datos de productores e ingredientes.</p></div>
      </HeroVideo>

      <Section tone="sunken"><Container size="wide"><Newsletter /></Container></Section>
    </main>
  );
}
